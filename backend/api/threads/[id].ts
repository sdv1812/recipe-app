import { VercelRequest, VercelResponse } from "@vercel/node";
import { getThreadsCollection } from "../../lib/db";
import { Thread } from "../../../shared/types";
import { requireAuth, unauthorizedResponse } from "../../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }

  const { id: threadId } = req.query;

  if (!threadId || typeof threadId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Thread ID is required",
    });
  }

  try {
    const threads = await getThreadsCollection();

    // GET - Get single thread
    if (req.method === "GET") {
      const thread = await threads.findOne({ id: threadId, userId });

      if (!thread) {
        return res.status(404).json({
          success: false,
          error: "Thread not found",
        });
      }

      return res.status(200).json({
        success: true,
        thread,
      });
    }

    // PUT - Update thread
    if (req.method === "PUT") {
      const updates = req.body;

      const result = await threads.findOneAndUpdate(
        { id: threadId, userId },
        {
          $set: {
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "Thread not found",
        });
      }

      return res.status(200).json({
        success: true,
        thread: result,
      });
    }

    // DELETE - Delete thread
    if (req.method === "DELETE") {
      const result = await threads.deleteOne({ id: threadId, userId });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Thread not found",
        });
      }

      return res.status(200).json({
        success: true,
      });
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Error in thread handler:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
