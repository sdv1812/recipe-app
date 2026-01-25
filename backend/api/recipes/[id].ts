import { VercelRequest, VercelResponse } from "@vercel/node";
import { getRecipesCollection } from "../../lib/db";
import { Recipe } from "../../../shared/types";
import { requireAuth, unauthorizedResponse } from "../../lib/auth";

interface RecipeResponse {
  success: boolean;
  recipe?: Recipe;
  message?: string;
  error?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({
      success: false,
      error: "Recipe ID is required",
    });
  }

  try {
    const recipes = await getRecipesCollection();

    // GET - Get single recipe
    if (req.method === "GET") {
      const recipe = await recipes.findOne({ id, userId });

      if (!recipe) {
        return res.status(404).json({
          success: false,
          error: "Recipe not found",
        });
      }

      return res.status(200).json({
        success: true,
        recipe,
      });
    }

    // PUT - Update recipe
    if (req.method === "PUT") {
      const updates = req.body;

      // Verify user owns this recipe
      const result = await recipes.updateOne(
        { id, userId },
        {
          $set: {
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Recipe not found or unauthorized",
        });
      }

      const updatedRecipe = await recipes.findOne({ id, userId });

      return res.status(200).json({
        success: true,
        recipe: updatedRecipe || undefined,
      });
    }

    // DELETE - Delete recipe
    if (req.method === "DELETE") {
      // Verify user owns this recipe
      const result = await recipes.deleteOne({ id, userId });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Recipe not found or unauthorized",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Recipe deleted successfully",
      });
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Error in recipe handler:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
