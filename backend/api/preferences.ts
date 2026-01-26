import { VercelRequest, VercelResponse } from "@vercel/node";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "../lib/db";
import { requireAuth, unauthorizedResponse } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }

  try {
    const users = await getUsersCollection();

    // GET - Get user preferences
    if (req.method === "GET") {
      const user = await users.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        preferences: user.preferences || [],
      });
    }

    // POST - Add a preference
    if (req.method === "POST") {
      const { preference } = req.body;

      if (!preference || typeof preference !== "string") {
        return res.status(400).json({
          success: false,
          error: "Preference is required and must be a string",
        });
      }

      const result = await users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $addToSet: { preferences: preference.trim() }, // addToSet prevents duplicates
          $set: { updatedAt: new Date() },
        },
      );

      const user = await users.findOne({ _id: new ObjectId(userId) });

      return res.status(200).json({
        success: true,
        preferences: user?.preferences || [],
      });
    }

    // DELETE - Remove a preference
    if (req.method === "DELETE") {
      const { preference } = req.body;

      if (!preference || typeof preference !== "string") {
        return res.status(400).json({
          success: false,
          error: "Preference is required and must be a string",
        });
      }

      await users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $pull: { preferences: preference },
          $set: { updatedAt: new Date() },
        },
      );

      const user = await users.findOne({ _id: new ObjectId(userId) });

      return res.status(200).json({
        success: true,
        preferences: user?.preferences || [],
      });
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Error in preferences handler:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
