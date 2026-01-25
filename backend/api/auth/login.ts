import { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcrypt";
import { validateApiKey, unauthorizedResponse } from "../../lib/auth";
import { getUsersCollection } from "../../lib/db";
import { generateToken } from "../../lib/jwt";
import { UserDocument } from "../../lib/types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validate API key
  if (!validateApiKey(req)) {
    return unauthorizedResponse(res);
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const users = await getUsersCollection();

    // Find user
    const user = await users.findOne<UserDocument>({
      email: email.toLowerCase(),
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    if (!user._id) {
      return res.status(500).json({
        success: false,
        error: "User ID not found",
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error("Error in login handler:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
