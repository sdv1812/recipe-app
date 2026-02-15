import { Resend } from "resend";
import { render } from "@react-email/components";
import PasswordResetEmail from "../emails/PasswordResetEmail";
import PasswordChangedEmail from "../emails/PasswordChangedEmail";

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
      subject: "Reset Your RecipeApp Password",
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
      subject: "Your RecipeApp Password Was Changed",
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
