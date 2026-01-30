import { VercelRequest, VercelResponse } from "@vercel/node";
import { getThreadsCollection } from "../../lib/db";
import { nanoid } from "nanoid";
import { Thread } from "../../../shared/types";
import { requireAuth, unauthorizedResponse } from "../../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }

  try {
    const threads = await getThreadsCollection();

    // GET - List user's threads
    if (req.method === "GET") {
      const threadList = await threads
        .find({ userId })
        .sort({ updatedAt: -1 })
        .toArray();

      return res.status(200).json({
        success: true,
        threads: threadList,
      });
    }

    // POST - Create new thread
    if (req.method === "POST") {
      const { title = "New chat" } = req.body;

      const newThread: Thread = {
        id: nanoid(),
        userId,
        title,
        status: "draft",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await threads.insertOne(newThread);

      return res.status(201).json({
        success: true,
        thread: newThread,
      });
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Error in threads handler:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
