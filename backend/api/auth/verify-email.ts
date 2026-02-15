import { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { validateApiKey, unauthorizedResponse } from "../../lib/auth";
import { getUsersCollection } from "../../lib/db";

/**
 * POST /api/auth/verify-email
 * Verify user's email address with token
 */
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
    const { email, token } = req.body;

    // Validate input
    if (!email || !token) {
      return res.status(400).json({
        success: false,
        error: "Email and verification token are required",
      });
    }

    const users = await getUsersCollection();

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with matching email and token
    const user = await users.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: hashedToken,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification token",
      });
    }

    // Check if token has expired
    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Verification token has expired. Please request a new verification email.",
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified",
      });
    }

    // Update user to mark email as verified and remove token
    await users.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          isEmailVerified: true,
          updatedAt: new Date(),
        },
        $unset: {
          emailVerificationToken: "",
          emailVerificationExpires: "",
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Error in verify-email handler:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
