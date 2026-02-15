import { Resend } from "resend";
import { render } from "@react-email/components";
import PasswordResetEmail from "../emails/PasswordResetEmail";
import PasswordChangedEmail from "../emails/PasswordChangedEmail";
import EmailVerification from "../emails/EmailVerification";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendPasswordResetEmailParams {
  to: string;
  resetLink: string;
  userName?: string;
}

export interface SendPasswordChangedEmailParams {
  to: string;
  userName?: string;
}

/**
 * Send password reset email with reset link
 */
export async function sendPasswordResetEmail({
  to,
  resetLink,
  userName,
}: SendPasswordResetEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!process.env.FROM_EMAIL) {
      throw new Error("FROM_EMAIL is not configured");
    }

    const emailHtml = await render(PasswordResetEmail({ resetLink, userName }));

    console.log("Reset link being sent:", resetLink); // Debug log

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject: "Reset Your SousAI Password",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send password reset email:", error);
      return { success: false, error: error.message };
    }

    console.log("Password reset email sent successfully:", data?.id);
    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail({
  to,
  userName,
}: SendPasswordChangedEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!process.env.FROM_EMAIL) {
      throw new Error("FROM_EMAIL is not configured");
    }

    const emailHtml = await render(PasswordChangedEmail({ userName }));

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject: "Your SousAI Password Was Changed",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send password changed email:", error);
      return { success: false, error: error.message };
    }

    console.log("Password changed email sent successfully:", data?.id);
    return { success: true };
  } catch (error) {
    console.error("Error sending password changed email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface SendEmailVerificationParams {
  to: string;
  verificationUrl: string;
}

/**
 * Send email verification link
 */
export async function sendEmailVerification({
  to,
  verificationUrl,
}: SendEmailVerificationParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!process.env.FROM_EMAIL) {
      throw new Error("FROM_EMAIL is not configured");
    }

    const emailHtml = await render(
      EmailVerification({ verificationUrl, email: to }),
    );

    console.log("Verification link being sent:", verificationUrl); // Debug log

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject: "Verify Your SousAI Email Address",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send email verification:", error);
      return { success: false, error: error.message };
    }

    console.log("Email verification sent successfully:", data?.id);
    return { success: true };
  } catch (error) {
    console.error("Error sending email verification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
