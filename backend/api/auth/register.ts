import { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { validateApiKey, unauthorizedResponse } from "../../lib/auth";
import { getUsersCollection } from "../../lib/db";
import { generateToken } from "../../lib/jwt";
import { UserDocument } from "../../lib/types";
import { sendEmailVerification } from "../../lib/email";

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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const result = await users.insertOne({
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      name: name || email.split("@")[0],
      isEmailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: verificationExpires,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userId = result.insertedId.toString();

    // Determine base URL
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Create verification URL
    const verificationUrl = `${baseUrl}/api/verify-email-page?token=${verificationToken}&email=${encodeURIComponent(email.toLowerCase())}`;

    // Send verification email (don't block registration if email fails)
    sendEmailVerification({
      to: email.toLowerCase(),
      verificationUrl,
    }).catch((error) => {
      console.error("Failed to send verification email:", error);
    });

    // Generate JWT token (user can still use app, but with limited access)
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
        isEmailVerified: false,
      },
      token,
      message:
        "Account created successfully. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Error in register handler:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
