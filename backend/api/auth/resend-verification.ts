import { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { validateApiKey, unauthorizedResponse } from "../../lib/auth";
import { getUsersCollection } from "../../lib/db";
import { sendEmailVerification } from "../../lib/email";

/**
 * POST /api/auth/resend-verification
 * Resend email verification link
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
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const users = await getUsersCollection();

    // Find user
    const user = await users.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a verification link will be sent.",
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await users.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          emailVerificationToken: hashedVerificationToken,
          emailVerificationExpires: verificationExpires,
          updatedAt: new Date(),
        },
      },
    );

    // Determine base URL
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Create verification URL
    const verificationUrl = `${baseUrl}/api/verify-email-page?token=${verificationToken}&email=${encodeURIComponent(email.toLowerCase())}`;

    // Send verification email
    const emailResult = await sendEmailVerification({
      to: email.toLowerCase(),
      verificationUrl,
    });

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      return res.status(500).json({
        success: false,
        error: "Failed to send verification email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch (error) {
    console.error("Error in resend-verification handler:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
