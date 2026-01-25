import { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken, extractTokenFromHeader } from "./jwt";

export function validateApiKey(req: VercelRequest): boolean {
  const apiKey = req.headers["x-api-key"];
  const validKey = process.env.API_SECRET_KEY;

  if (!validKey) {
    console.error("API_SECRET_KEY not configured");
    return false;
  }

  // Handle both string and string[] from headers
  const keyToCheck = Array.isArray(apiKey) ? apiKey[0] : apiKey;

  // Trim whitespace from both values
  const trimmedKey = keyToCheck?.trim();
  const trimmedValidKey = validKey.trim();

  return trimmedKey === trimmedValidKey;
}

/**
 * Validate JWT token and return userId if valid
 */
export function validateAuthToken(req: VercelRequest): string | null {
  const token = extractTokenFromHeader(req);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  return payload?.userId || null;
}

/**
 * Require authentication middleware - validates both API key and JWT token
 */
export function requireAuth(req: VercelRequest): string | null {
  // First validate API key
  if (!validateApiKey(req)) {
    return null;
  }

  // Then validate JWT token
  const userId = validateAuthToken(req);
  return userId;
}

export function unauthorizedResponse(res: VercelResponse, message?: string) {
  return res.status(401).json({
    success: false,
    error: message || "Unauthorized: Invalid or missing API key",
  });
}
