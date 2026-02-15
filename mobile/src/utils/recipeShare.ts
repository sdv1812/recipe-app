import { Recipe, RecipeImport } from "../../../shared/types";
import { Alert, Share } from "react-native";
import * as Clipboard from "expo-clipboard";

/**
 * Converts a Recipe object back to RecipeImport format for sharing
 */
export function recipeToShareableJson(recipe: Recipe): RecipeImport {
  return {
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    prepTimeMinutes: recipe.prepTimeMinutes,
    marinateTimeMinutes: recipe.marinateTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    category: recipe.category,
    tags: recipe.tags,
    ingredients: recipe.ingredients,
    preparationSteps: recipe.preparationSteps.map((step) => step.instruction),
    cookingSteps: recipe.cookingSteps.map((step) => step.instruction),
    imageUrl: recipe.imageUrl,
  };
}

/**
 * Generates human-readable shareable text format for a recipe
 */
export function generateShareableText(recipe: Recipe): string {
  let text = "🍳 Recipe shared from RecipeApp\n\n";
  text += `${recipe.title}\n\n`;

  if (recipe.description) {
    text += `${recipe.description}\n\n`;
  }

  // Add time and servings info
  const timeInfo = [];
  if (recipe.prepTimeMinutes) timeInfo.push(`Prep: ${recipe.prepTimeMinutes}m`);
  if (recipe.marinateTimeMinutes)
    timeInfo.push(`Marinate: ${recipe.marinateTimeMinutes}m`);
  if (recipe.cookTimeMinutes) timeInfo.push(`Cook: ${recipe.cookTimeMinutes}m`);
  if (recipe.servings) timeInfo.push(`Servings: ${recipe.servings}`);

  if (timeInfo.length > 0) {
    text += `⏱️ ${timeInfo.join(" • ")}\n\n`;
  }

  // Add ingredients
  text += "📝 Ingredients:\n";
  for (const ingredient of recipe.ingredients) {
    const quantity = ingredient.quantity ? `${ingredient.quantity} ` : "";
    const unit = ingredient.unit ? `${ingredient.unit} ` : "";
    text += `• ${quantity}${unit}${ingredient.name}\n`;
  }
  text += "\n";

  // Add preparation steps
  if (recipe.preparationSteps && recipe.preparationSteps.length > 0) {
    text += "🔪 Preparation:\n";
    recipe.preparationSteps.forEach((step, index) => {
      text += `${index + 1}. ${step.instruction}\n`;
    });
    text += "\n";
  }

  // Add cooking steps
  if (recipe.cookingSteps && recipe.cookingSteps.length > 0) {
    text += "👨‍🍳 Cooking:\n";
    recipe.cookingSteps.forEach((step, index) => {
      text += `${index + 1}. ${step.instruction}\n`;
    });
    text += "\n";
  }

  // Add tags if available
  if (recipe.tags && recipe.tags.length > 0) {
    text += `🏷️ ${recipe.tags.join(", ")}\n\n`;
  }

  text += "---\n";
  text +=
    "💡 Want to save this recipe? Copy this entire message, open RecipeApp, start a new chat, and paste it! The AI will help you create and save this recipe.";

  return text;
}

/**
 * Shares a recipe using native share sheet
 */
export async function shareRecipe(recipe: Recipe): Promise<boolean> {
  try {
    const shareableText = generateShareableText(recipe);

    // Use native Share API to open share sheet
    const result = await Share.share({
      message: shareableText,
      title: `Recipe: ${recipe.title}`,
    });

    if (result.action === Share.sharedAction) {
      // Successfully shared
      return true;
    } else if (result.action === Share.dismissedAction) {
      // User dismissed the share sheet
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sharing recipe:", error);
    throw error;
  }
}
