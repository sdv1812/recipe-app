import { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth, unauthorizedResponse } from "../../lib/auth";
import { getGroceryList, addToGroceryList } from "../../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication (validates both API key and JWT token)
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }

  // GET - List all groceries
  if (req.method === "GET") {
    try {
      const groceries = await getGroceryList(userId);
      return res.status(200).json(groceries);
    } catch (error) {
      console.error("Error fetching groceries:", error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to fetch groceries",
      });
    }
  }

  // POST - Add items to grocery list
  if (req.method === "POST") {
    try {
      const { items, recipeId } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Items array is required" });
      }

      const result = await addToGroceryList(userId, items, recipeId);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error adding to groceries:", error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to add items to groceries",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
