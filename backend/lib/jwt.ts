import jwt from "jsonwebtoken";
import { VercelRequest } from "@vercel/node";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // Token expires in 7 days

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract JWT token from Authorization header
 */
export function extractTokenFromHeader(req: VercelRequest): string | null {
  const authHeader = req.headers["authorization"];
  const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (!token) {
    return null;
  }

  // Extract token from "Bearer <token>" format
  if (token.startsWith("Bearer ")) {
    return token.substring(7);
  }

  return token;
}

/**
 * Get user ID from request (after auth middleware)
 */
export function getUserIdFromRequest(req: VercelRequest): string | null {
  const token = extractTokenFromHeader(req);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  return payload?.userId || null;
}
