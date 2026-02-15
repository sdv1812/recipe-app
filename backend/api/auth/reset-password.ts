import { VercelRequest, VercelResponse } from "@vercel/node";
import { getUsersCollection } from "../../lib/db";
import { validateApiKey } from "../../lib/auth";
import { sendPasswordChangedEmail } from "../../lib/email";
import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * POST /api/auth/reset-password
 * Reset password using token from email
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

    const { email, token, newPassword } = req.body;

    // Validate inputs
    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Email, token, and new password are required",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Hash the token to match what's stored in the database
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({
      email: normalizedEmail,
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          updatedAt: new Date(),
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: "",
        },
      },
    );

    // Send confirmation email
    await sendPasswordChangedEmail({
      to: user.email,
      userName: user.name,
    });

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
