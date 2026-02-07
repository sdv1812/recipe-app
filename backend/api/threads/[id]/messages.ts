import { VercelRequest, VercelResponse } from "@vercel/node";
import { getThreadsCollection, getRecipesCollection } from "../../../lib/db";
import { nanoid } from "nanoid";
import {
  ThreadMessage,
  Recipe,
  RecipeImport,
  PreparationStep,
  CookingStep,
  ShoppingItem,
  SendMessageRequest,
} from "../../../../shared/types";
import { requireAuth, unauthorizedResponse } from "../../../lib/auth";
import { getChatWithRecipeDraft } from "../../../lib/openai";
import { extractTextFromImage } from "../../../lib/vision";
import { detectPreference } from "../../../lib/preferenceDetection";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require authentication
  const userId = requireAuth(req);
  if (!userId) {
    return unauthorizedResponse(res, "Authentication required");
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  const { id: threadId } = req.query;
  const { message = "", action, imageData }: SendMessageRequest = req.body;

  if (!threadId || typeof threadId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Thread ID is required",
    });
  }

  if ((typeof message !== "string" || message.length === 0) && !action) {
    return res.status(400).json({
      success: false,
      error: "Message is required",
    });
  }

  try {
    const threads = await getThreadsCollection();
    const recipes = await getRecipesCollection();

    // Get the thread
    const thread = await threads.findOne({ id: threadId, userId });

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: "Thread not found",
      });
    }

    // Handle OCR action if provided
    let scannedText: string | undefined;
    if (action === "scan_recipe_ocr" && imageData) {
      try {
        console.log("Extracting text from image...");
        scannedText = await extractTextFromImage(imageData);
        console.log(`Extracted ${scannedText.length} characters`);
      } catch (error) {
        console.error("OCR error:", error);
        return res.status(400).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to extract text from image",
        });
      }
    }

    // Create user message (or system message for scanned text)
    const userMessage: ThreadMessage = scannedText
      ? {
          id: nanoid(),
          threadId,
          role: "system",
          content: "📄 Scanned text from image",
          scannedText,
          timestamp: new Date().toISOString(),
        }
      : {
          id: nanoid(),
          threadId,
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        };

    // Build chat history for AI
    const chatHistory = thread.messages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // If the user is working with an unsaved draft, provide the most recent draft recipe as context
    const latestDraftRecipe: RecipeImport | null = thread.recipeId
      ? null
      : (thread.messages
          .slice()
          .reverse()
          .find(
            (msg) =>
              msg.role === "assistant" && Boolean(msg.recipeData) && !msg.error,
          )?.recipeData as RecipeImport | undefined) || null;

    // Get existing recipe context if thread is bound to a recipe
    let existingRecipe: Recipe | null = null;
    if (thread.recipeId) {
      existingRecipe = await recipes.findOne({
        id: thread.recipeId,
        userId,
      });
    }

    // Prepare the message for LLM (inject scanned text if OCR was performed)
    const llmMessage = scannedText
      ? `I scanned a recipe image and extracted this text:\n\n${scannedText}\n\nPlease analyze this and create a recipe from it.`
      : message;

    // Get AI response with recipeDraft
    const { assistantText, recipeDraft } = await getChatWithRecipeDraft(
      llmMessage,
      chatHistory,
      existingRecipe
        ? { id: existingRecipe.id, title: existingRecipe.title }
        : null,
      latestDraftRecipe,
    );

    // Create assistant message
    const assistantMessage: ThreadMessage = {
      id: nanoid(),
      threadId,
      role: "assistant",
      content: assistantText,
      timestamp: new Date().toISOString(),
      recipeData: recipeDraft || undefined,
    };

    // Add messages to thread
    const updatedMessages = [...thread.messages, userMessage, assistantMessage];

    // Update thread title if this is the first message
    let threadTitle = thread.title;
    if (thread.messages.length === 0 && !scannedText) {
      // Truncate first user message to 8-40 chars for thread title
      const truncated = message.trim().slice(0, 40);
      threadTitle = truncated.length >= 8 ? truncated : "New chat";
    }

    // Update thread
    await threads.updateOne(
      { id: threadId, userId },
      {
        $set: {
          messages: updatedMessages,
          title: threadTitle,
          updatedAt: new Date().toISOString(),
        },
      },
    );

    // Detect preferences from user message
    const detectedPrefs = await detectPreference(message);
    if (detectedPrefs && detectedPrefs.length > 0) {
      console.log("Detected preferences:", detectedPrefs);
      // Note: Preference saving would happen separately
    }

    return res.status(200).json({
      success: true,
      message: userMessage,
      assistantMessage,
      recipeDraft: recipeDraft || null,
      recipeCreated: false, // Legacy field
      recipe: undefined, // Legacy field
    });
  } catch (error) {
    console.error("Error handling message:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to process message",
    });
  }
}
