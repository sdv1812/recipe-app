import * as Sharing from 'expo-sharing';
import { Recipe, RecipeImport } from '../types/recipe';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

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
    preparationSteps: recipe.preparationSteps.map(step => step.instruction),
    cookingSteps: recipe.cookingSteps.map(step => step.instruction),
    imageUrl: recipe.imageUrl,
  };
}

/**
 * Shares a recipe by copying JSON to clipboard and showing share dialog
 */
export async function shareRecipe(recipe: Recipe): Promise<boolean> {
  try {
    const shareableRecipe = recipeToShareableJson(recipe);
    const jsonString = JSON.stringify(shareableRecipe, null, 2);
    
    // Copy to clipboard
    await Clipboard.setStringAsync(jsonString);
    
    Alert.alert(
      'Recipe Copied!',
      'The recipe JSON has been copied to your clipboard. You can now paste it in WhatsApp, Messages, or any other app.',
      [{ text: 'OK' }]
    );

    return true;
  } catch (error) {
    console.error('Error sharing recipe:', error);
    throw error;
  }
}
