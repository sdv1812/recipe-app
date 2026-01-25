import { VercelRequest, VercelResponse } from "@vercel/node";
import { ObjectId } from "mongodb";
import { generateRecipe } from "../lib/openai";
import { getUsersCollection } from "../lib/db";
import {
  GenerateRecipeRequest,
  GenerateRecipeResponse,
  RecipeImport,
} from "../../shared/types";
import { requireAuth, unauthorizedResponse } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body as GenerateRecipeRequest;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        success: false,
        error: "Prompt is required and must be a string",
      });
    }

    // System prompt to enforce JSON structure
    const systemPrompt = `You are a professional chef and recipe generator. 
Generate a recipe based on the user's request and return it in this EXACT JSON format:

{
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "servings": 4,
  "prepTimeMinutes": 15,
  "marinateTimeMinutes": 0,
  "cookTimeMinutes": 30,
  "category": ["main-course", "cuisine-type"],
  "tags": ["dietary-tag", "cooking-method"],
  "ingredients": [
    {
      "name": "Ingredient name",
      "quantity": "2",
      "unit": "cups"
    }
  ],
  "preparationSteps": [
    "Detailed preparation step 1",
    "Detailed preparation step 2"
  ],
  "cookingSteps": [
    "Detailed cooking step 1",
    "Detailed cooking step 2"
  ]
}

IMPORTANT: 
- Return ONLY valid JSON, no additional text
- Include realistic cooking times
- Provide detailed, clear instructions
- Use appropriate categories and tags`;

    // Get user preferences
    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(userId) });
    const userPreferences = user?.preferences || [];

    const aiResponse = await generateRecipe(
      prompt,
      systemPrompt,
      userPreferences,
    );

    // Parse the JSON response
    let recipe: RecipeImport;
    try {
      recipe = JSON.parse(aiResponse);
    } catch (parseError) {
      // Try to extract JSON from the response if it's wrapped in text
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipe = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse recipe JSON from AI response");
      }
    }

    return res.status(200).json({
      success: true,
      recipe,
    });
  } catch (error) {
    console.error("Error generating recipe:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate recipe";
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
