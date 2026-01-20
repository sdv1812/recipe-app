import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '../types/recipe';

const RECIPES_STORAGE_KEY = '@recipes';

export const storageUtils = {
  /**
   * Get all recipes from AsyncStorage
   */
  async getAllRecipes(): Promise<Recipe[]> {
    try {
      const recipesJson = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
      if (!recipesJson) return [];
      return JSON.parse(recipesJson);
    } catch (error) {
      console.error('Error loading recipes:', error);
      return [];
    }
  },

  /**
   * Save a new recipe
   */
  async saveRecipe(recipe: Recipe): Promise<void> {
    try {
      const recipes = await this.getAllRecipes();
      recipes.push(recipe);
      await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }
  },

  /**
   * Update an existing recipe
   */
  async updateRecipe(updatedRecipe: Recipe): Promise<void> {
    try {
      const recipes = await this.getAllRecipes();
      const index = recipes.findIndex((r) => r.id === updatedRecipe.id);
      if (index !== -1) {
        recipes[index] = updatedRecipe;
        await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  },

  /**
   * Delete a recipe
   */
  async deleteRecipe(recipeId: string): Promise<void> {
    try {
      const recipes = await this.getAllRecipes();
      const filtered = recipes.filter((r) => r.id !== recipeId);
      await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  },

  /**
   * Get a single recipe by ID
   */
  async getRecipeById(recipeId: string): Promise<Recipe | null> {
    try {
      const recipes = await this.getAllRecipes();
      return recipes.find((r) => r.id === recipeId) || null;
    } catch (error) {
      console.error('Error getting recipe:', error);
      return null;
    }
  },

  /**
   * Clear all recipes from storage
   */
  async clearAllRecipes(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECIPES_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing all recipes:', error);
      throw error;
    }
  },
};
