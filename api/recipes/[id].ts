import { VercelRequest, VercelResponse } from '@vercel/node';
import { getRecipesCollection } from '../lib/db';
import { Recipe } from '../../shared/types';

interface RecipeResponse {
  success: boolean;
  recipe?: Recipe;
  message?: string;
  error?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<RecipeResponse>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Recipe ID is required' 
    });
  }

  try {
    const recipes = await getRecipesCollection();

    // GET - Get single recipe
    if (req.method === 'GET') {
      const recipe = await recipes.findOne({ id });

      if (!recipe) {
        return res.status(404).json({
          success: false,
          error: 'Recipe not found'
        });
      }

      return res.status(200).json({
        success: true,
        recipe
      });
    }

    // PUT - Update recipe
    if (req.method === 'PUT') {
      const updates = req.body;
      
      // TODO: Verify userId matches recipe owner when auth is implemented
      
      const result = await recipes.updateOne(
        { id },
        { 
          $set: {
            ...updates,
            updatedAt: new Date().toISOString()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Recipe not found'
        });
      }

      const updatedRecipe = await recipes.findOne({ id });

      return res.status(200).json({
        success: true,
        recipe: updatedRecipe || undefined
      });
    }

    // DELETE - Delete recipe
    if (req.method === 'DELETE') {
      // TODO: Verify userId matches recipe owner when auth is implemented
      
      const result = await recipes.deleteOne({ id });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Recipe not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Recipe deleted successfully'
      });
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Error in recipe handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}
