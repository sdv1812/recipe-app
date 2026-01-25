import { VercelRequest, VercelResponse } from "@vercel/node";
import { validateApiKey, unauthorizedResponse } from "../../lib/auth";
import { getUsersCollection } from "../../lib/db";
import { getUserIdFromRequest } from "../../lib/jwt";
import { ObjectId } from "mongodb";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validate API key
  if (!validateApiKey(req)) {
    return unauthorizedResponse(res);
  }

  // Only allow GET
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error in me handler:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
