import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSharesCollection, getRecipesCollection } from '../lib/db';
import { Recipe } from '../../shared/types';

interface ShareResponse {
  success: boolean;
  recipe?: Recipe;
  error?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Share token is required'
      });
    }

    const shares = await getSharesCollection();
    const share = await shares.findOne({ token });

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Share link not found or expired'
      });
    }

    // Check if expired (if expiresAt is set)
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Share link has expired'
      });
    }

    // Get the recipe
    const recipes = await getRecipesCollection();
    const recipe = await recipes.findOne({ id: share.recipeId });

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

  } catch (error) {
    console.error('Error fetching shared recipe:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch shared recipe';
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}
