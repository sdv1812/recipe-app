import { VercelRequest, VercelResponse } from "@vercel/node";
import * as fs from "fs";
import * as path from "path";

/**
 * GET /api/verify-email-page
 * Serves the email verification HTML page
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token, email } = req.query;

  // Serve the verification page (validation happens client-side via API call)
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(getVerifyEmailHTML());
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

let verifyEmailTemplate: string | null = null;

function getVerifyEmailHTML(): string {
  if (!verifyEmailTemplate) {
    verifyEmailTemplate = loadTemplate("verify-email.html", "verify-email.css");
  }
  return verifyEmailTemplate;
}
