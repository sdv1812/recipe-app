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
  imageUrl?: string;
  isFavorite?: boolean;
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
