import { VercelRequest, VercelResponse } from "@vercel/node";
import { getRecipesCollection } from "../../lib/db";
import { nanoid } from "nanoid";
import {
  Recipe,
  PreparationStep,
  CookingStep,
  ShoppingItem,
} from "../../../shared/types";
import { requireAuth, unauthorizedResponse } from "../../lib/auth";

interface RecipesResponse {
  success: boolean;
  recipes?: Recipe[];
  recipe?: Recipe;
  error?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication (validates both API key and JWT token)
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }
  console.log("Authenticated userId:", userId);
  try {
    const recipes = await getRecipesCollection();

    // GET - List user's recipes
    if (req.method === "GET") {
      console.log("Fetching recipes for userId:", userId);
      // Only return recipes owned by the authenticated user
      const recipeList = await recipes
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({
        success: true,
        recipes: recipeList,
      });
    }

    // POST - Create new recipe
    if (req.method === "POST") {
      console.log("Creating new recipe for userId:", userId);
      const recipeData = req.body;

      console.log("=== POST /api/recipes ===");
      console.log("Received recipe data:", JSON.stringify(recipeData, null, 2));
      console.log("Authenticated userId:", userId);

      // Transform string arrays to proper step objects
      const preparationSteps: PreparationStep[] = Array.isArray(
        recipeData.preparationSteps,
      )
        ? recipeData.preparationSteps.map(
            (step: string | PreparationStep, index: number) =>
              typeof step === "string"
                ? { stepNumber: index + 1, instruction: step }
                : step,
          )
        : [];

      const cookingSteps: CookingStep[] = Array.isArray(recipeData.cookingSteps)
        ? recipeData.cookingSteps.map(
            (step: string | CookingStep, index: number) =>
              typeof step === "string"
                ? { stepNumber: index + 1, instruction: step }
                : step,
          )
        : [];

      // Generate shopping list from ingredients
      const shoppingList: ShoppingItem[] =
        recipeData.ingredients?.map((ing: any) => ({
          id: nanoid(),
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          purchased: false,
        })) || [];

      const recipeId = nanoid();
      const newRecipe: Recipe = {
        ...recipeData,
        id: recipeId,
        userId, // Use authenticated userId
        preparationSteps,
        cookingSteps,
        shoppingList,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublished: false,
        likes: 0,
        isFavorite: false,
        aiChatHistory: [],
      };

      console.log("About to insert recipe:", {
        id: recipeId,
        userId,
        title: newRecipe.title,
        ingredientsCount: newRecipe.ingredients?.length,
        prepStepsCount: preparationSteps.length,
        cookStepsCount: cookingSteps.length,
      });

      try {
        const result = await recipes.insertOne(newRecipe as any);

        console.log("Insert result:", {
          acknowledged: result.acknowledged,
          insertedId: result.insertedId?.toString(),
        });

        // Verify the recipe was actually inserted
        const insertedRecipe = await recipes.findOne({ id: recipeId });
        console.log("Verification - Recipe found in DB:", !!insertedRecipe);

        if (!insertedRecipe) {
          console.error(
            "ERROR: Recipe was not found in database after insertion!",
          );
        }

        return res.status(201).json({
          success: true,
          recipe: newRecipe,
        });
      } catch (insertError) {
        console.error("Error during insertOne:", insertError);
        throw insertError;
      }
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Error in recipes handler:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
