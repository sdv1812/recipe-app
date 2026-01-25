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
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    const users = await getUsersCollection();

    // Check if user already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await users.insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split("@")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const userId = result.insertedId.toString();

    // Generate JWT token
    const token = generateToken({
      userId,
      email: email.toLowerCase(),
    });

    return res.status(201).json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
      },
      token,
    });
  } catch (error) {
    console.error("Error in register handler:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
