import { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth, unauthorizedResponse } from "../../lib/auth";
import { clearCompletedGroceries } from "../../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication (validates both API key and JWT token)
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }

  if (req.method === "DELETE") {
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

  return res.status(405).json({ error: "Method not allowed" });
}
