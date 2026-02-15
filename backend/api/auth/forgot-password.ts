import { VercelRequest, VercelResponse } from "@vercel/node";
import { getUsersCollection } from "../../lib/db";
import { validateApiKey } from "../../lib/auth";
import { sendPasswordResetEmail } from "../../lib/email";
import crypto from "crypto";

/**
 * POST /api/auth/forgot-password
 * Request password reset - sends email with reset token
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Validate API key
    if (!validateApiKey(req)) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
      });
    }

    const { email } = req.body;

    // Validate email
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get user by email
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ email: normalizedEmail });

    // Always return success even if user doesn't exist (security best practice)
    // This prevents email enumeration attacks
    if (!user) {
      console.log(
        `Password reset requested for non-existent email: ${normalizedEmail}`,
      );
      return res.status(200).json({
        success: true,
        message: "If that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Update user with reset token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetTokenHash,
          resetPasswordExpires: expiresAt,
          updatedAt: new Date(),
        },
      },
    );

    // Create reset link - using API endpoint that returns HTML
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.BASE_URL || "http://localhost:3000";

    const resetLink = `${baseUrl}/api/reset-password-page?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send email
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      resetLink,
      userName: user.name,
    });

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      return res.status(500).json({
        success: false,
        error: "Failed to send reset email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "If that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
