import axios from "axios";
import { RecipeImport, Recipe } from "../types/recipe";

// Use your deployed backend URL or localhost for development
const API_BASE_URL = __DEV__
  ? "http://localhost:3000/api"
  : "https://sous-ai-eta.vercel.app/api";

// API key for authentication - keep this secure
const API_KEY = "sousai_secret_2026_mobile_app";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor to add API key to every request
apiClient.interceptors.request.use(
  (config) => {
    config.headers["x-api-key"] = API_KEY;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.message;
      throw new Error(message);
    } else if (error.request) {
      // Request made but no response received
      throw new Error("Network error. Please check your connection.");
    } else {
      // Something else happened
      throw new Error(error.message);
    }
  },
);

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
    const { data } = await apiClient.post<GenerateRecipeResponse>(
      "/generate-recipe",
      { prompt } as GenerateRecipeRequest,
    );

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
    const { data } = await apiClient.post<ChatWithRecipeResponse>(
      "/chat/recipe",
      {
        recipeId,
        message,
        chatHistory,
      } as ChatWithRecipeRequest,
    );

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
    const { data } = await apiClient.post("/recipes", recipe);

    if (!data.success || !data.recipe) {
      throw new Error(data.error || "Failed to create recipe");
    }

    return data.recipe;
  },

  /**
   * Create a shareable link
   */
  async createShareLink(recipeId: string): Promise<string> {
    const { data } = await apiClient.post("/share/create", { recipeId });

    if (!data.success || !data.shareUrl) {
      throw new Error(data.error || "Failed to create share link");
    }

    return data.shareUrl;
  },
};
