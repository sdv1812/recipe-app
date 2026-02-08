import axios from "axios";
import {
  RecipeImport,
  Recipe,
  GroceryItem,
  Thread,
  ThreadMessage,
  CreateThreadRequest,
  CreateThreadResponse,
  GetThreadsResponse,
  GetThreadResponse,
  SendMessageRequest,
  SendMessageResponse,
  UpdateThreadRequest,
  UpdateThreadResponse,
  DeleteThreadResponse,
} from "../../../shared/types";
import { authStorage } from "./storage";

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

// Request interceptor to add API key and auth token to every request
apiClient.interceptors.request.use(
  async (config) => {
    // Add API key
    config.headers["x-api-key"] = API_KEY;

    // Add auth token if available
    const token = await authStorage.getToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Check for 401 Unauthorized (token expired or invalid)
      if (error.response.status === 401) {
        // Clear auth data
        await authStorage.clearAuth();
        // Trigger auth error callback to update UI
        authStorage.triggerAuthError();
        throw new Error("Session expired. Please login again.");
      }

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

export const api = {
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
   * Get all recipes for the current user
   */
  async getAllRecipes(): Promise<Recipe[]> {
    const { data } = await apiClient.get("/recipes");

    if (!data.success || !data.recipes) {
      throw new Error(data.error || "Failed to get recipes");
    }

    return data.recipes;
  },

  /**
   * Get a single recipe by ID
   */
  async getRecipeById(recipeId: string): Promise<Recipe> {
    const { data } = await apiClient.get(`/recipes/${recipeId}`);

    if (!data.success || !data.recipe) {
      throw new Error(data.error || "Failed to get recipe");
    }

    return data.recipe;
  },

  /**
   * Update a recipe
   */
  async updateRecipe(
    recipeId: string,
    updates: Partial<Recipe>,
  ): Promise<Recipe> {
    const { data } = await apiClient.put(`/recipes/${recipeId}`, updates);

    if (!data.success || !data.recipe) {
      throw new Error(data.error || "Failed to update recipe");
    }

    return data.recipe;
  },

  /**
   * Delete a recipe
   */
  async deleteRecipe(recipeId: string): Promise<void> {
    const { data } = await apiClient.delete(`/recipes/${recipeId}`);

    if (!data.success) {
      throw new Error(data.error || "Failed to delete recipe");
    }
  },

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<{
    user: { id: string; email: string; name: string };
    token: string;
  }> {
    const { data } = await apiClient.post("/auth/register", {
      email,
      password,
      name,
    });

    if (!data.success || !data.user || !data.token) {
      throw new Error(data.error || "Failed to register");
    }

    return { user: data.user, token: data.token };
  },

  /**
   * Login user
   */
  async login(
    email: string,
    password: string,
  ): Promise<{
    user: { id: string; email: string; name: string };
    token: string;
  }> {
    const { data } = await apiClient.post("/auth/login", {
      email,
      password,
    });

    if (!data.success || !data.user || !data.token) {
      throw new Error(data.error || "Failed to login");
    }

    return { user: data.user, token: data.token };
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<{ id: string; email: string; name: string }> {
    const { data } = await apiClient.get("/auth/me");

    if (!data.success || !data.user) {
      throw new Error(data.error || "Failed to get user info");
    }

    return data.user;
  },

  /**
   * Logout user (clear local auth data)
   */
  async logout(): Promise<void> {
    await authStorage.clearAuth();
  },

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<string[]> {
    const { data } = await apiClient.get("/preferences");

    if (!data.success) {
      throw new Error(data.error || "Failed to get preferences");
    }

    return data.preferences || [];
  },

  /**
   * Add a preference
   */
  async addPreference(preference: string): Promise<string[]> {
    const { data } = await apiClient.post("/preferences", { preference });

    if (!data.success) {
      throw new Error(data.error || "Failed to add preference");
    }

    return data.preferences || [];
  },

  /**
   * Remove a preference
   */
  async removePreference(preference: string): Promise<string[]> {
    const { data } = await apiClient.delete("/preferences", {
      data: { preference },
    });

    if (!data.success) {
      throw new Error(data.error || "Failed to remove preference");
    }

    return data.preferences || [];
  },

  /**
   * Get grocery list
   */
  async getGroceries(): Promise<GroceryItem[]> {
    const { data } = await apiClient.get("/groceries");
    return data || [];
  },

  /**
   * Add items to grocery list
   */
  async addToGroceries(
    items: Array<{ name: string; quantity?: string; unit?: string }>,
    recipeId?: string,
  ): Promise<{ added: number; updated: number }> {
    const { data } = await apiClient.post("/groceries", {
      items,
      recipeId,
    });
    return data;
  },

  /**
   * Toggle grocery item completion
   */
  async toggleGroceryItem(itemId: string): Promise<GroceryItem> {
    const { data } = await apiClient.put(`/groceries/${itemId}`);
    return data;
  },
  /**
   * Update grocery item details
   */
  async updateGroceryItem(
    itemId: string,
    updates: { name?: string; quantity?: string; unit?: string },
  ): Promise<GroceryItem> {
    const { data } = await apiClient.patch(`/groceries/${itemId}`, updates);
    if (!data.success || !data.item) {
      throw new Error(data.error || "Failed to update grocery item");
    }
    return data.item;
  },
  /**
   * Delete a grocery item
   */
  async deleteGroceryItem(itemId: string): Promise<void> {
    await apiClient.delete(`/groceries/${itemId}`);
  },

  /**
   * Clear completed grocery items
   */
  async clearCompletedGroceries(): Promise<void> {
    await apiClient.delete("/groceries/clear-done");
  },

  // ========== THREAD API METHODS ==========

  /**
   * Create a new thread (chat workspace)
   */
  async createThread(title: string = "New chat"): Promise<Thread> {
    const { data } = await apiClient.post<CreateThreadResponse>("/threads", {
      title,
    } as CreateThreadRequest);

    if (!data.success || !data.thread) {
      throw new Error(data.error || "Failed to create thread");
    }

    return data.thread;
  },

  /**
   * Get all threads for the current user
   */
  async getAllThreads(): Promise<Thread[]> {
    const { data } = await apiClient.get<GetThreadsResponse>("/threads");

    if (!data.success || !data.threads) {
      throw new Error(data.error || "Failed to get threads");
    }

    return data.threads;
  },

  /**
   * Get a single thread by ID
   */
  async getThreadById(threadId: string): Promise<Thread> {
    const { data } = await apiClient.get<GetThreadResponse>(
      `/threads/${threadId}`,
    );

    if (!data.success || !data.thread) {
      throw new Error(data.error || "Failed to get thread");
    }

    return data.thread;
  },

  /**
   * Send a message in a thread
   */
  async sendMessage(
    threadId: string,
    message: string,
    action?: "scan_recipe_ocr",
    imageData?: string,
  ): Promise<{
    userMessage: ThreadMessage;
    assistantMessage: ThreadMessage;
    recipeDraft?: RecipeImport | null;
    recipe?: Recipe;
    recipeCreated?: boolean;
  }> {
    const { data } = await apiClient.post<SendMessageResponse>(
      `/threads/${threadId}/messages`,
      {
        threadId,
        message,
        action,
        imageData,
      } as SendMessageRequest,
    );

    if (!data.success || !data.message || !data.assistantMessage) {
      throw new Error(data.error || "Failed to send message");
    }

    return {
      userMessage: data.message,
      assistantMessage: data.assistantMessage,
      recipeDraft: data.recipeDraft,
      recipe: data.recipe,
      recipeCreated: data.recipeCreated,
    };
  },

  /**
   * Update a thread
   */
  async updateThread(
    threadId: string,
    updates: UpdateThreadRequest,
  ): Promise<Thread> {
    const { data } = await apiClient.put<UpdateThreadResponse>(
      `/threads/${threadId}`,
      updates,
    );

    if (!data.success || !data.thread) {
      throw new Error(data.error || "Failed to update thread");
    }

    return data.thread;
  },

  /**
   * Delete a thread
   */
  async deleteThread(threadId: string): Promise<void> {
    const { data } = await apiClient.delete<DeleteThreadResponse>(
      `/threads/${threadId}`,
    );

    if (!data.success) {
      throw new Error(data.error || "Failed to delete thread");
    }
  },
};
