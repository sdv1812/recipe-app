import { VercelRequest, VercelResponse } from "@vercel/node";
import { extractTextFromImage } from "../../lib/vision";
import { generateRecipe } from "../../lib/openai";
import { verifyToken } from "../../lib/jwt";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get image data from request body
    const { imageData } = req.body;

    if (!imageData || typeof imageData !== "string") {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Step 1: Extract text from image using Google Cloud Vision
    console.log("Extracting text from image...");
    const extractedText = await extractTextFromImage(imageData);

    if (!extractedText || extractedText.length < 20) {
      return res.status(400).json({
        error:
          "Could not extract meaningful text from image. Please ensure the image contains a readable recipe.",
      });
    }

    console.log(`Extracted ${extractedText.length} characters of text`);

    // Step 2: Use GPT-3.5 to convert OCR text into structured recipe
    const prompt = `You have received OCR text extracted from a recipe image. The text may have some OCR errors or formatting issues. Your task is to parse it and return a well-structured recipe.

OCR Text:
${extractedText}

Please analyze this text and extract:
- Recipe title
- Description (if mentioned)
- Ingredients with quantities and units
- Preparation and cooking steps
- Servings, cooking time, prep time (if mentioned)
- Categories and tags

Return a complete recipe in JSON format following the exact schema provided in the system prompt.`;

    const recipeJson = await generateRecipe(prompt);

    // Parse and validate the JSON
    let recipe;
    try {
      recipe = JSON.parse(recipeJson);
    } catch (error) {
      console.error("Failed to parse recipe JSON:", recipeJson);
      return res.status(500).json({
        error: "Failed to parse recipe from image. Please try again.",
      });
    }

    // Validate required fields
    if (
      !recipe.title ||
      !recipe.ingredients ||
      !Array.isArray(recipe.ingredients)
    ) {
      return res.status(400).json({
        error: "Could not extract a valid recipe from the image.",
      });
    }

    return res.status(200).json({
      success: true,
      recipe,
      extractedText, // Include for debugging if needed
    });
  } catch (error) {
    console.error("Error scanning recipe:", error);

    if (error instanceof Error) {
      // Check for specific Vision API errors
      if (error.message.includes("No text detected")) {
        return res.status(400).json({
          error: "No text found in the image. Please use a clearer photo.",
        });
      }

      return res.status(500).json({
        error: error.message || "Failed to scan recipe image",
      });
    }

    return res.status(500).json({ error: "Failed to scan recipe image" });
  }
}
