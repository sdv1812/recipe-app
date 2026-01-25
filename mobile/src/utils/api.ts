import { RecipeImport, Recipe } from "../types/recipe";

// Use your deployed backend URL or localhost for development
const API_BASE_URL = __DEV__
  ? "http://localhost:3000/api"
  : "https://sous-ai-eta.vercel.app/api";

// API key for authentication - keep this secure
const API_KEY = "sousai_secret_2026_mobile_app";

interface GenerateRecipeRequest {
  prompt: string;
}

interface GenerateRecipeResponse {
  success: boolean;
  recipe?: RecipeImport;
  error?: string;
}

interface ChatWithRecipeRequest {
  recipeId: string;
  message: string;
  chatHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
}

interface ChatWithRecipeResponse {
  success: boolean;
  updatedRecipe?: Recipe;
  assistantMessage?: string;
  error?: string;
}

export const api = {
  /**
   * Generate a new recipe using AI
   */
  async generateRecipe(prompt: string): Promise<RecipeImport> {
    const response = await fetch(`${API_BASE_URL}/generate-recipe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ prompt } as GenerateRecipeRequest),
    });

    const data: GenerateRecipeResponse = await response.json();

    if (!data.success || !data.recipe) {
      throw new Error(data.error || "Failed to generate recipe");
    }

    return data.recipe;
  },

  /**
   * Chat with AI to modify an existing recipe
   */
  async chatWithRecipe(
    recipeId: string,
    message: string,
    chatHistory: Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: string;
    }> = [],
  ): Promise<{ recipe: Recipe; message: string }> {
    const response = await fetch(`${API_BASE_URL}/chat/recipe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({
        recipeId,
        message,
        chatHistory,
      } as ChatWithRecipeRequest),
    });

    const data: ChatWithRecipeResponse = await response.json();

    if (!data.success || !data.updatedRecipe || !data.assistantMessage) {
      throw new Error(data.error || "Failed to chat with AI");
    }

    return {
      recipe: data.updatedRecipe,
      message: data.assistantMessage,
    };
  },

  /**
   * Create a recipe on the server
   */
  async createRecipe(recipe: RecipeImport): Promise<Recipe> {
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(recipe),
    });

    const data = await response.json();

    if (!data.success || !data.recipe) {
      throw new Error(data.error || "Failed to create recipe");
    }

    return data.recipe;
  },

  /**
   * Create a shareable link
   */
  async createShareLink(recipeId: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/share/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ recipeId }),
    });

    const data = await response.json();

    if (!data.success || !data.shareUrl) {
      throw new Error(data.error || "Failed to create share link");
    }

    return data.shareUrl;
  },
};
