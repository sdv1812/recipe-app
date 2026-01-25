import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe } from "../types/recipe";

const RECIPES_STORAGE_KEY = "@recipes";
const AUTH_STORAGE_KEY = "@auth";

interface AuthData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

export const authStorage = {
  /**
   * Save authentication data
   */
  async saveAuth(authData: AuthData): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
      console.error("Error saving auth data:", error);
      throw error;
    }
  },

  /**
   * Get authentication data
   */
  async getAuth(): Promise<AuthData | null> {
    try {
      const authJson = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!authJson) return null;
      return JSON.parse(authJson);
    } catch (error) {
      console.error("Error loading auth data:", error);
      return null;
    }
  },

  /**
   * Get authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      const auth = await this.getAuth();
      return auth?.token || null;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  /**
   * Clear authentication data (logout)
   */
  async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing auth data:", error);
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const auth = await this.getAuth();
      return auth !== null && !!auth.token;
    } catch (error) {
      console.error("Error checking auth status:", error);
      return false;
    }
  },
};

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
      console.error("Error loading recipes:", error);
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
      console.error("Error saving recipe:", error);
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
        await AsyncStorage.setItem(
          RECIPES_STORAGE_KEY,
          JSON.stringify(recipes),
        );
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
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
      console.error("Error deleting recipe:", error);
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
      console.error("Error getting recipe:", error);
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
      console.error("Error clearing all recipes:", error);
      throw error;
    }
  },

  /**
   * Toggle favorite status of a recipe
   */
  async toggleFavorite(recipeId: string): Promise<void> {
    try {
      const recipes = await this.getAllRecipes();
      const recipe = recipes.find((r) => r.id === recipeId);
      if (recipe) {
        recipe.isFavorite = !recipe.isFavorite;
        await AsyncStorage.setItem(
          RECIPES_STORAGE_KEY,
          JSON.stringify(recipes),
        );
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      throw error;
    }
  },
};
