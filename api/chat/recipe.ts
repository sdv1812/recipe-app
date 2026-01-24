import { VercelRequest, VercelResponse } from '@vercel/node';
import { getRecipesCollection } from '../lib/db';
import { updateRecipeWithChat } from '../lib/openai';
import { ChatWithRecipeRequest, ChatWithRecipeResponse, Recipe, RecipeImport } from '../../shared/types';
import { nanoid } from 'nanoid';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { recipeId, message, chatHistory = [] } = req.body as ChatWithRecipeRequest;

    if (!recipeId || !message) {
      return res.status(400).json({
        success: false,
        error: 'recipeId and message are required'
      });
    }

    const recipes = await getRecipesCollection();
    const recipe = await recipes.findOne({ id: recipeId });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }

    // Get AI response with recipe updates
    const aiResponse = await updateRecipeWithChat(recipe, message, chatHistory);

    // Parse updated recipe
    let updatedRecipeData: RecipeImport;
    try {
      updatedRecipeData = JSON.parse(aiResponse);
    } catch (parseError) {
      // Try to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        updatedRecipeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse updated recipe JSON');
      }
    }

    // Transform string arrays to proper step objects
    const preparationSteps = Array.isArray(updatedRecipeData.preparationSteps)
      ? updatedRecipeData.preparationSteps.map((step, index) => 
          typeof step === 'string' 
            ? { stepNumber: index + 1, instruction: step }
            : step
        )
      : [];

    const cookingSteps = Array.isArray(updatedRecipeData.cookingSteps)
      ? updatedRecipeData.cookingSteps.map((step, index) => 
          typeof step === 'string'
            ? { stepNumber: index + 1, instruction: step }
            : step
        )
      : [];

    // Transform shopping list
    const shoppingList = Array.isArray(updatedRecipeData.shoppingList)
      ? updatedRecipeData.shoppingList.map((item) => 
          typeof item === 'string'
            ? { id: nanoid(), name: item, quantity: '', purchased: false }
            : item
        )
      : [];

    // Update chat history
    const newChatHistory = [
      ...(recipe.aiChatHistory || []),
      {
        role: 'user' as const,
        content: message,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date().toISOString()
      }
    ];

    // Update recipe in database
    await recipes.updateOne(
      { id: recipeId },
      {
        $set: {
          ...updatedRecipeData,
          preparationSteps,
          cookingSteps,
          shoppingList,
          id: recipe.id,
          userId: recipe.userId,
          createdAt: recipe.createdAt,
          updatedAt: new Date().toISOString(),
          aiChatHistory: newChatHistory
        }
      }
    );

    const updatedRecipe = await recipes.findOne({ id: recipeId });

    return res.status(200).json({
      success: true,
      updatedRecipe: updatedRecipe || undefined,
      assistantMessage: aiResponse
    });

  } catch (error) {
    console.error('Error in chat handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat message';
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}
