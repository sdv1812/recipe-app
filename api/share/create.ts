import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSharesCollection, getRecipesCollection } from '../lib/db';
import { nanoid } from 'nanoid';
import { CreateShareLinkRequest, CreateShareLinkResponse, ShareToken } from '../../shared/types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<CreateShareLinkResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { recipeId } = req.body as CreateShareLinkRequest;

    if (!recipeId) {
      return res.status(400).json({
        success: false,
        error: 'recipeId is required'
      });
    }

    // Verify recipe exists
    const recipes = await getRecipesCollection();
    const recipe = await recipes.findOne({ id: recipeId });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }

    // TODO: Verify user owns recipe when auth is implemented

    // Create share token
    const shares = await getSharesCollection();
    const token = nanoid(10);

    const shareDoc: ShareToken = {
      id: nanoid(),
      recipeId,
      token,
      createdAt: new Date().toISOString(),
      // Optional: Set expiration (e.g., 30 days)
      // expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    await shares.insertOne(shareDoc as any);

    // Construct share URL
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${token}`;

    return res.status(201).json({
      success: true,
      shareUrl,
      token
    });

  } catch (error) {
    console.error('Error creating share link:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create share link';
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}
