import { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth, unauthorizedResponse } from "../../lib/auth";
import { toggleGroceryItem } from "../../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication (validates both API key and JWT token)
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Item ID is required" });
  }

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

  if (req.method === "DELETE") {
    try {
      const { deleteGroceryItem } = await import("../../lib/db");
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
