import { VercelRequest, VercelResponse } from "@vercel/node";
import { ObjectId } from "mongodb";
import { getRecipesCollection, getUsersCollection } from "../../lib/db";
import { updateRecipeWithChat } from "../../lib/openai";
import { detectPreference } from "../../lib/preferenceDetection";
import {
  ChatWithRecipeRequest,
  ChatWithRecipeResponse,
  Recipe,
  RecipeImport,
} from "../../../shared/types";
import { nanoid } from "nanoid";
import { requireAuth, unauthorizedResponse } from "../../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const {
      recipeId,
      message,
      chatHistory = [],
    } = req.body as ChatWithRecipeRequest;

    if (!recipeId || !message) {
      return res.status(400).json({
        success: false,
        error: "recipeId and message are required",
      });
    }

    const recipes = await getRecipesCollection();
    const recipe = await recipes.findOne({ id: recipeId });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: "Recipe not found",
      });
    }

    // Get user preferences
    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(userId) });
    const userPreferences = user?.preferences || [];

    // Detect if user is stating a new preference
    const detectedPreference = await detectPreference(message);
    let preferenceAdded = false;

    if (detectedPreference && !userPreferences.includes(detectedPreference)) {
      // Save the new preference
      await users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $addToSet: { preferences: detectedPreference },
          $set: { updatedAt: new Date() },
        },
      );
      userPreferences.push(detectedPreference);
      preferenceAdded = true;
    }

    // Get AI response with recipe updates (including user preferences)
    const aiResponse = await updateRecipeWithChat(
      recipe,
      message,
      chatHistory,
      userPreferences,
    );

    // Helper function to clean and extract JSON
    const extractJSON = (text: string): string => {
      // Remove markdown code blocks
      let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");

      // Try to find JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }

      let jsonStr = jsonMatch[0];

      // Fix common JSON issues
      // Remove trailing commas before closing braces/brackets
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");

      // Ensure property names are double-quoted (fix single quotes or unquoted)
      jsonStr = jsonStr.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":');

      return jsonStr;
    };

    // Parse updated recipe with better error handling
    let updatedRecipeData: RecipeImport;
    try {
      const cleanedJSON = extractJSON(aiResponse);
      updatedRecipeData = JSON.parse(cleanedJSON);

      // Validate required fields
      if (!updatedRecipeData.title || !updatedRecipeData.ingredients) {
        throw new Error("Invalid recipe structure - missing required fields");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      console.error("Parse error:", parseError);

      return res.status(500).json({
        success: false,
        error:
          "AI returned invalid recipe format. Please try rephrasing your request.",
      });
    }

    // Transform string arrays to proper step objects
    const preparationSteps = Array.isArray(updatedRecipeData.preparationSteps)
      ? updatedRecipeData.preparationSteps.map((step, index) =>
          typeof step === "string"
            ? { stepNumber: index + 1, instruction: step }
            : step,
        )
      : [];

    const cookingSteps = Array.isArray(updatedRecipeData.cookingSteps)
      ? updatedRecipeData.cookingSteps.map((step, index) =>
          typeof step === "string"
            ? { stepNumber: index + 1, instruction: step }
            : step,
        )
      : [];

    // Transform shopping list
    const shoppingList = Array.isArray(updatedRecipeData.shoppingList)
      ? updatedRecipeData.shoppingList.map((item) =>
          typeof item === "string"
            ? { id: nanoid(), name: item, quantity: "", purchased: false }
            : item,
        )
      : [];

    // Update chat history
    const newChatHistory = [
      ...(recipe.aiChatHistory || []),
      {
        role: "user" as const,
        content: message,
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant" as const,
        content: aiResponse,
        timestamp: new Date().toISOString(),
      },
    ];

    // Update recipe in database
    await recipes.updateOne(
      { id: recipeId },
      {
        $set: {
          ...updatedRecipeData,
          preparationSteps,
          preferenceAdded: preferenceAdded ? detectedPreference : undefined,
          cookingSteps,
          shoppingList,
          id: recipe.id,
          userId: recipe.userId,
          createdAt: recipe.createdAt,
          updatedAt: new Date().toISOString(),
          aiChatHistory: newChatHistory,
        },
      },
    );

    const updatedRecipe = await recipes.findOne({ id: recipeId });

    return res.status(200).json({
      success: true,
      updatedRecipe: updatedRecipe || undefined,
      assistantMessage: aiResponse,
    });
  } catch (error) {
    console.error("Error in chat handler:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process chat message";
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
