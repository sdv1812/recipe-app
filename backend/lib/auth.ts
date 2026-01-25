import { VercelRequest, VercelResponse } from "@vercel/node";

export function validateApiKey(req: VercelRequest): boolean {
  const apiKey = req.headers["x-api-key"];
  const validKey = process.env.API_SECRET_KEY;

  // Enhanced debug logging
  console.log("=== API Key Validation Debug ===");
  console.log("Received API Key:", apiKey);
  console.log("Expected API Key:", validKey);
  console.log("API_SECRET_KEY exists:", !!validKey);
  console.log(
    "All env vars with 'API':",
    Object.keys(process.env).filter((k) => k.includes("API")),
  );

  if (!validKey) {
    console.error("API_SECRET_KEY not configured");
    return false;
  }

  // Handle both string and string[] from headers
  const keyToCheck = Array.isArray(apiKey) ? apiKey[0] : apiKey;

  // Trim whitespace from both values
  const trimmedKey = keyToCheck?.trim();
  const trimmedValidKey = validKey.trim();

  console.log("Key to check (after array handling):", keyToCheck);
  console.log("Trimmed key:", trimmedKey);
  console.log("Trimmed valid key:", trimmedValidKey);
  console.log("Key lengths:", keyToCheck?.length, "vs", validKey.length);
  console.log("Keys match:", trimmedKey === trimmedValidKey);
  console.log("================================");

  return trimmedKey === trimmedValidKey;
}

export function unauthorizedResponse(res: VercelResponse) {
  return res.status(401).json({
    success: false,
    error: "Unauthorized: Invalid or missing API key",
  });
}
