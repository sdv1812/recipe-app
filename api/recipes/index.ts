import { VercelRequest, VercelResponse } from '@vercel/node';
import { getRecipesCollection } from '../lib/db';
import { nanoid } from 'nanoid';
import { Recipe, PreparationStep, CookingStep, ShoppingItem } from '../../shared/types';

interface RecipesResponse {
  success: boolean;
  recipes?: Recipe[];
  recipe?: Recipe;
  error?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const recipes = await getRecipesCollection();

    // GET - List all recipes (with optional filters)
    if (req.method === 'GET') {
      const { userId, isPublished } = req.query;
      
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

      const recipeList = await recipes
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({
        success: true,
        recipes: recipeList
      });
    }

    // POST - Create new recipe
    if (req.method === 'POST') {
      const recipeData = req.body;

      // TODO: Get userId from auth token when implemented
      const userId = (req.headers['x-user-id'] as string) || 'anonymous';

      // Transform string arrays to proper step objects
      const preparationSteps: PreparationStep[] = Array.isArray(recipeData.preparationSteps)
        ? recipeData.preparationSteps.map((step: string | PreparationStep, index: number) => 
            typeof step === 'string' 
              ? { stepNumber: index + 1, instruction: step }
              : step
          )
        : [];

      const cookingSteps: CookingStep[] = Array.isArray(recipeData.cookingSteps)
        ? recipeData.cookingSteps.map((step: string | CookingStep, index: number) => 
            typeof step === 'string'
              ? { stepNumber: index + 1, instruction: step }
              : step
          )
        : [];

      // Generate shopping list from ingredients
      const shoppingList: ShoppingItem[] = recipeData.ingredients?.map((ing: any) => ({
        id: nanoid(),
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        purchased: false
      })) || [];

      const newRecipe: Recipe = {
        ...recipeData,
        id: nanoid(),
        userId,
        preparationSteps,
        cookingSteps,
        shoppingList,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublished: false,
        likes: 0,
        isFavorite: false,
        aiChatHistory: []
      };

      await recipes.insertOne(newRecipe as any);

      return res.status(201).json({
        success: true,
        recipe: newRecipe
      });
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Error in recipes handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}
