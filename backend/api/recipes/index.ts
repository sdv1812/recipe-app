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

  try {
    const recipes = await getRecipesCollection();

    // GET - List user's recipes
    if (req.method === "GET") {
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
      const recipeData = req.body;

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

      const newRecipe: Recipe = {
        ...recipeData,
        id: nanoid(),
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

      await recipes.insertOne(newRecipe as any);

      return res.status(201).json({
        success: true,
        recipe: newRecipe,
      });
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
