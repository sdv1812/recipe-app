import vision from "@google-cloud/vision";
import type { ImageAnnotatorClient } from "@google-cloud/vision/build/src/v1";

let visionClient: ImageAnnotatorClient | null = null;

/**
 * Get or create the Google Cloud Vision client
 */
function getVisionClient(): ImageAnnotatorClient {
  if (!visionClient) {
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      throw new Error(
        "Please define GOOGLE_CLOUD_VISION_API_KEY environment variable",
      );
    }

    // Initialize with API key (simpler than service account)
    visionClient = new vision.ImageAnnotatorClient({
      apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY.trim(),
    });
  }

  return visionClient;
}

/**
 * Extract text from an image using Google Cloud Vision OCR
 * @param imageData - Base64 encoded image data
 * @returns Extracted text
 */
export async function extractTextFromImage(imageData: string): Promise<string> {
  const client = getVisionClient();

  // Remove data URI prefix if present
  const base64Image = imageData.replace(/^data:image\/\w+;base64,/, "");

  // Perform text detection
  const [result] = await client.textDetection({
    image: {
      content: base64Image,
    },
  });

  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    throw new Error("No text detected in image");
  }

  // First annotation contains the full text
  const fullText = detections[0].description || "";

  if (!fullText.trim()) {
    throw new Error("No readable text found in image");
  }

  return fullText.trim();
}
