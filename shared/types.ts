// Shared types between API and React Native app

export interface Ingredient {
  name: string;
  quantity: string;
  unit?: string;
}

export interface PreparationStep {
  stepNumber: number;
  instruction: string;
  completed?: boolean;
}

export interface CookingStep {
  stepNumber: number;
  instruction: string;
  duration?: string;
  completed?: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit?: string;
  purchased: boolean;
}

export interface Recipe {
  id: string;
  userId?: string; // Added for multi-user support
  title: string;
  description?: string;
  servings?: number;
  prepTimeMinutes?: number;
  marinateTimeMinutes?: number;
  cookTimeMinutes?: number;
  category: string[];
  tags: string[];
  ingredients: Ingredient[];
  preparationSteps: PreparationStep[];
  cookingSteps: CookingStep[];
  shoppingList: ShoppingItem[];
  createdAt: string;
  updatedAt?: string;
  imageUrl?: string;
  isFavorite?: boolean;
  isPublished?: boolean; // For social features
  likes?: number;
  aiChatHistory?: ChatMessage[];
}

export interface RecipeImport {
  title: string;
  description?: string;
  servings?: number;
  prepTimeMinutes?: number;
  marinateTimeMinutes?: number;
  cookTimeMinutes?: number;
  category?: string[];
  tags?: string[];
  ingredients: Ingredient[];
  preparationSteps: string[] | PreparationStep[];
  cookingSteps: string[] | CookingStep[];
  shoppingList?: string[] | ShoppingItem[];
  imageUrl?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  preferences?: string[]; // User food preferences
  createdAt: string;
}

export interface ShareToken {
  id: string;
  recipeId: string;
  token: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  recipe?: RecipeImport; // Include recipe data in assistant messages for context
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface GroceryItem {
  id: string;
  userId: string;
  name: string;
  quantity?: string;
  unit?: string;
  completed: boolean;
  recipeIds: string[]; // Track which recipes this item came from
  createdAt: string;
  completedAt?: string;
}

// API Request/Response types
export interface GenerateRecipeRequest {
  prompt: string;
}

export interface GenerateRecipeResponse {
  success: boolean;
  recipe?: RecipeImport;
  error?: string;
}

export interface ChatWithRecipeRequest {
  recipeId: string;
  message: string;
  chatHistory?: ChatMessage[];
}

export interface ChatWithRecipeResponse {
  success: boolean;
  updatedRecipe?: Recipe;
  assistantMessage?: string;
  preferenceAdded?: string;
  error?: string;
}

export interface CreateShareLinkRequest {
  recipeId: string;
}

export interface CreateShareLinkResponse {
  success: boolean;
  shareUrl?: string;
  token?: string;
  error?: string;
}
