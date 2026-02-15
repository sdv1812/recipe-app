import { VercelRequest, VercelResponse } from "@vercel/node";
import * as fs from "fs";
import * as path from "path";

// Cache templates for better performance
let resetPasswordTemplate: string | null = null;
let resetPasswordStyles: string | null = null;
let errorTemplate: string | null = null;
let errorStyles: string | null = null;

/**
 * GET /api/reset-password-page
 * Serves the password reset HTML page
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token, email } = req.query;

  // Validate parameters
  if (!token || !email) {
    return res.status(400).send(getErrorHTML());
  }

  // Serve the password reset page
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(getResetPasswordHTML(token as string, email as string));
}

function loadTemplate(templateName: string, stylesName: string): string {
  const templatesDir = path.join(process.cwd(), "templates");
  const html = fs.readFileSync(path.join(templatesDir, templateName), "utf-8");
  const css = fs.readFileSync(path.join(templatesDir, stylesName), "utf-8");

  // Inline the CSS by replacing the link tag with a style tag
  return html.replace(
    '<link rel="stylesheet" href="{{STYLES_URL}}">',
    `<style>${css}</style>`,
  );
}

function getErrorHTML(): string {
  if (!errorTemplate) {
    errorTemplate = loadTemplate("error.html", "error.css");
  }
  return errorTemplate;
}

function getResetPasswordHTML(token: string, email: string): string {
  if (!resetPasswordTemplate) {
    resetPasswordTemplate = loadTemplate(
      "reset-password.html",
      "reset-password.css",
    );
  }

  // Replace placeholders with actual values
  return resetPasswordTemplate
    .replace(/\{\{EMAIL\}\}/g, email)
    .replace(/\{\{TOKEN\}\}/g, token);
}
