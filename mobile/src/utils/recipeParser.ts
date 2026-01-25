import {
  Recipe,
  RecipeImport,
  PreparationStep,
  CookingStep,
  ShoppingItem,
} from "../../../shared/types";

/**
 * Parse imported recipe JSON and convert to Recipe format
 */
export const parseRecipeJson = (jsonData: RecipeImport): Recipe => {
  const recipeId = `recipe_${Date.now()}`;

  // Normalize preparation steps
  const preparationSteps: PreparationStep[] = jsonData.preparationSteps.map(
    (step, index) => {
      if (typeof step === "string") {
        return {
          stepNumber: index + 1,
          instruction: step,
          completed: false,
        };
      }
      return {
        ...step,
        stepNumber: step.stepNumber || index + 1,
        completed: false,
      };
    },
  );

  // Normalize cooking steps
  const cookingSteps: CookingStep[] = jsonData.cookingSteps.map(
    (step, index) => {
      if (typeof step === "string") {
        return {
          stepNumber: index + 1,
          instruction: step,
          completed: false,
        };
      }
      return {
        ...step,
        stepNumber: step.stepNumber || index + 1,
        completed: false,
      };
    },
  );

  // Generate shopping list from ingredients if not provided
  let shoppingList: ShoppingItem[] = [];
  if (jsonData.shoppingList && jsonData.shoppingList.length > 0) {
    shoppingList = jsonData.shoppingList.map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `shopping_${recipeId}_${index}`,
          name: item,
          quantity: "1",
          purchased: false,
        };
      }
      return {
        ...item,
        id: `shopping_${recipeId}_${index}`,
        purchased: false,
      };
    });
  } else {
    // Auto-generate from ingredients
    shoppingList = jsonData.ingredients.map((ingredient, index) => ({
      id: `shopping_${recipeId}_${index}`,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      purchased: false,
    }));
  }

  return {
    id: recipeId,
    title: jsonData.title,
    description: jsonData.description,
    servings: jsonData.servings,
    prepTimeMinutes: jsonData.prepTimeMinutes,
    marinateTimeMinutes: jsonData.marinateTimeMinutes,
    cookTimeMinutes: jsonData.cookTimeMinutes,
    category: jsonData.category || [],
    tags: jsonData.tags || [],
    ingredients: jsonData.ingredients,
    preparationSteps,
    cookingSteps,
    shoppingList,
    createdAt: new Date().toISOString(),
    imageUrl: jsonData.imageUrl,
  };
};

/**
 * Validate recipe JSON structure
 */
export const validateRecipeJson = (
  data: any,
): { valid: boolean; error?: string } => {
  if (!data.title || typeof data.title !== "string") {
    return { valid: false, error: "Recipe must have a title" };
  }

  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    return { valid: false, error: "Recipe must have at least one ingredient" };
  }

  if (
    !Array.isArray(data.preparationSteps) &&
    !Array.isArray(data.cookingSteps)
  ) {
    return {
      valid: false,
      error: "Recipe must have preparation steps or cooking steps",
    };
  }

  return { valid: true };
};
