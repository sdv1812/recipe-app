import { VercelRequest, VercelResponse } from "@vercel/node";
import { getUsersCollection } from "../../lib/db";
import { requireAuth } from "../../lib/auth";
import { sendPasswordChangedEmail } from "../../lib/email";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
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
    // Require authentication
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid or missing authentication",
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: "New password must be different from current password",
      });
    }

    // Get user
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          updatedAt: new Date(),
        },
        // Clear any existing reset tokens
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
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
