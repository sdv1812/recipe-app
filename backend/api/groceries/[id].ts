import { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth, unauthorizedResponse } from "../../lib/auth";
import {
  toggleGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  clearCompletedGroceries,
} from "../../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication (validates both API key and JWT token)
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }

  const { id } = req.query;

  // Special route: DELETE /api/groceries/clear-done
  if (req.method === "DELETE" && id === "clear-done") {
    try {
      await clearCompletedGroceries(userId);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error clearing completed groceries:", error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to clear completed groceries",
      });
    }
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Item ID is required" });
  }

  // PUT - Toggle grocery item completion
  if (req.method === "PUT") {
    try {
      const result = await toggleGroceryItem(userId, id);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error toggling grocery item:", error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to toggle grocery item",
      });
    }
  }

  // PATCH - Update grocery item details
  if (req.method === "PATCH") {
    try {
      const { name, quantity, unit } = req.body;
      const result = await updateGroceryItem(userId, id, {
        name,
        quantity,
        unit,
      });
      return res.status(200).json({ success: true, item: result });
    } catch (error) {
      console.error("Error updating grocery item:", error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update grocery item",
      });
    }
  }

  // DELETE - Delete specific grocery item
  if (req.method === "DELETE") {
    try {
      await deleteGroceryItem(userId, id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting grocery item:", error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete grocery item",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
