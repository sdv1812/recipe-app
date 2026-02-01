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
} from "../../../../shared/types";
import { requireAuth, unauthorizedResponse } from "../../../lib/auth";
import {
  generateRecipe,
  getChatResponse,
  getRecipeTextResponse,
  getRecipeModificationTextResponse,
} from "../../../lib/openai";
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
  const { message } = req.body;

  if (!threadId || typeof threadId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Thread ID is required",
    });
  }

  if (!message || typeof message !== "string") {
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

    // Create user message
    const userMessage: ThreadMessage = {
      id: nanoid(),
      threadId,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Build chat history for AI (filter out any system messages)
    const chatHistory = thread.messages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Check what the user wants
    const {
      response: chatResponse,
      wantsRecipe,
      userConfirmedSave,
      userConfirmedUpdate,
    } = await getChatResponse(message, chatHistory);

    // Check if the last assistant message was asking for save/update confirmation
    const lastAssistantMessage = thread.messages
      .filter((msg) => msg.role === "assistant")
      .pop();
    const waitingForSaveConfirmation = lastAssistantMessage?.content.includes(
      "Would you like me to save this recipe",
    );
    const waitingForUpdateConfirmation = lastAssistantMessage?.content.includes(
      "Would you like me to update your saved recipe",
    );

    // Check if thread already has a saved recipe
    const hasExistingRecipe = !!thread.recipeId;

    // Get existing recipe for context
    let existingRecipe: Recipe | null = null;
    if (hasExistingRecipe) {
      existingRecipe = await recipes.findOne({
        id: thread.recipeId,
        userId,
      });
    }

    let recipeData: RecipeImport | null = null;
    let assistantContent = "";
    let parseError = false;

    // Scenario 1: User confirmed update and we were waiting for update confirmation
    if (userConfirmedUpdate && waitingForUpdateConfirmation) {
      // User said yes/sure - update existing recipe with JSON from conversation
      try {
        const chatContext = thread.messages
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");

        const prompt = `Based on the following conversation, generate the UPDATED recipe in JSON format:\n\n${chatContext}\n\nUser: ${message}`;

        const aiResponse = await generateRecipe(prompt);

        // Try to parse as recipe
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);

            // Validate it's a recipe (must have title and ingredients)
            if (parsedData?.title && parsedData?.ingredients?.length > 0) {
              recipeData = parsedData;
              assistantContent =
                "Perfect! I've updated your recipe with the changes. Check it out!";
            } else {
              assistantContent =
                "I had trouble updating that recipe. Could you describe the changes again?";
            }
          } else {
            assistantContent =
              "I couldn't update the recipe. Could you describe the changes again?";
          }
        } catch (error) {
          parseError = true;
          assistantContent =
            "Sorry, I had trouble updating the recipe. Please try describing the changes again.";
        }
      } catch (error) {
        console.error("Recipe update error:", error);
        assistantContent =
          "Sorry, I had trouble updating that recipe. Please try again.";
      }
    }
    // Scenario 2: User confirmed save and we were waiting for save confirmation
    else if (userConfirmedSave && waitingForSaveConfirmation) {
      // User said yes/sure/save it - generate JSON recipe from conversation
      try {
        const chatContext = thread.messages
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");

        const prompt = `Based on the following conversation, generate a complete recipe in JSON format:\n\n${chatContext}\n\nUser: ${message}`;

        const aiResponse = await generateRecipe(prompt);

        // Try to parse as recipe
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);

            // Validate it's a recipe (must have title and ingredients)
            if (parsedData?.title && parsedData?.ingredients?.length > 0) {
              recipeData = parsedData;
              assistantContent =
                "Great! I've saved the recipe to your collection. You can view and edit it anytime!";
            } else {
              assistantContent =
                "I had trouble saving that recipe. Could you describe it again?";
            }
          } else {
            assistantContent =
              "I couldn't save the recipe. Could you describe what you'd like to cook again?";
          }
        } catch (error) {
          parseError = true;
          assistantContent =
            "Sorry, I had trouble saving the recipe. Please try describing it again.";
        }
      } catch (error) {
        console.error("Recipe generation error:", error);
        assistantContent =
          "Sorry, I had trouble saving that recipe. Please try again.";
      }
    }
    // Scenario 3: User wants to modify existing recipe
    else if (wantsRecipe && hasExistingRecipe && existingRecipe) {
      // Recipe already exists - generate modification in TEXT format with update prompt
      try {
        const recipeTitle = existingRecipe.title || "your recipe";
        assistantContent = await getRecipeModificationTextResponse(
          message,
          recipeTitle,
          chatHistory,
        );
      } catch (error) {
        console.error("Recipe modification text generation error:", error);
        assistantContent =
          "Sorry, I had trouble generating that modification. Please try again.";
      }
    }
    // Scenario 4: User wants a new recipe (initial request)
    else if (wantsRecipe) {
      // Generate recipe in TEXT format with save prompt
      try {
        assistantContent = await getRecipeTextResponse(message, chatHistory);
      } catch (error) {
        console.error("Recipe text generation error:", error);
        assistantContent =
          "Sorry, I had trouble generating that recipe. Please try again.";
      }
    }
    // Scenario 5: Recipe exists but message isn't clearly recipe-related (fallback for modifications)
    // This catches cases like "remove sugar" or "can you add ginger" that might not trigger keywords
    else if (
      hasExistingRecipe &&
      existingRecipe &&
      !waitingForSaveConfirmation &&
      !waitingForUpdateConfirmation
    ) {
      // Assume it's a modification request since a recipe already exists
      try {
        const recipeTitle = existingRecipe.title || "your recipe";
        assistantContent = await getRecipeModificationTextResponse(
          message,
          recipeTitle,
          chatHistory,
        );
      } catch (error) {
        console.error("Recipe modification fallback error:", error);
        // If modification fails, fall back to chat response
        assistantContent = chatResponse;
      }
    }
    // Scenario 6: Just chatting
    else {
      assistantContent = chatResponse;
    }

    // Create assistant message
    const assistantMessage: ThreadMessage = {
      id: nanoid(),
      threadId,
      role: "assistant",
      content: assistantContent,
      timestamp: new Date().toISOString(),
      recipeData: recipeData || undefined,
      error: parseError,
    };

    // Add messages to thread
    const updatedMessages = [...thread.messages, userMessage, assistantMessage];

    let savedRecipe: Recipe | undefined;
    let recipeCreated = false;

    // If we have a valid recipe
    if (recipeData) {
      // Check if thread already has a recipe
      if (thread.recipeId) {
        // Update existing recipe
        const existingRecipe = await recipes.findOne({
          id: thread.recipeId,
          userId,
        });

        if (existingRecipe) {
          // Transform steps
          const preparationSteps: PreparationStep[] = Array.isArray(
            recipeData.preparationSteps,
          )
            ? recipeData.preparationSteps.map((step, idx) => ({
                stepNumber: idx + 1,
                instruction: typeof step === "string" ? step : step.instruction,
                completed:
                  existingRecipe.preparationSteps[idx]?.completed || false,
              }))
            : [];

          const cookingSteps: CookingStep[] = Array.isArray(
            recipeData.cookingSteps,
          )
            ? recipeData.cookingSteps.map((step, idx) => ({
                stepNumber: idx + 1,
                instruction: typeof step === "string" ? step : step.instruction,
                duration: typeof step === "string" ? undefined : step.duration,
                completed: existingRecipe.cookingSteps[idx]?.completed || false,
              }))
            : [];

          const shoppingList: ShoppingItem[] = Array.isArray(
            recipeData.shoppingList,
          )
            ? recipeData.shoppingList.map((item) => ({
                id: nanoid(),
                name: typeof item === "string" ? item : item.name,
                quantity: typeof item === "string" ? "" : item.quantity || "",
                unit: typeof item === "string" ? "" : item.unit,
                purchased: false,
              }))
            : recipeData.ingredients.map((ing) => ({
                id: nanoid(),
                name: ing.name,
                quantity: ing.quantity || "",
                unit: ing.unit || "",
                purchased: false,
              }));

          await recipes.updateOne(
            { id: thread.recipeId, userId },
            {
              $set: {
                title: recipeData.title,
                description: recipeData.description,
                servings: recipeData.servings,
                prepTimeMinutes: recipeData.prepTimeMinutes,
                marinateTimeMinutes: recipeData.marinateTimeMinutes,
                cookTimeMinutes: recipeData.cookTimeMinutes,
                category: recipeData.category || [],
                tags: recipeData.tags || [],
                ingredients: recipeData.ingredients,
                preparationSteps,
                cookingSteps,
                shoppingList,
                updatedAt: new Date().toISOString(),
              },
            },
          );

          savedRecipe = (await recipes.findOne({
            id: thread.recipeId,
            userId,
          })) as Recipe;
        }
      } else {
        // Create new recipe
        const preparationSteps: PreparationStep[] = Array.isArray(
          recipeData.preparationSteps,
        )
          ? recipeData.preparationSteps.map((step, idx) => ({
              stepNumber: idx + 1,
              instruction: typeof step === "string" ? step : step.instruction,
              completed: false,
            }))
          : [];

        const cookingSteps: CookingStep[] = Array.isArray(
          recipeData.cookingSteps,
        )
          ? recipeData.cookingSteps.map((step, idx) => ({
              stepNumber: idx + 1,
              instruction: typeof step === "string" ? step : step.instruction,
              duration: typeof step === "string" ? undefined : step.duration,
              completed: false,
            }))
          : [];

        const shoppingList: ShoppingItem[] = Array.isArray(
          recipeData.shoppingList,
        )
          ? recipeData.shoppingList.map((item) => ({
              id: nanoid(),
              name: typeof item === "string" ? item : item.name,
              quantity: typeof item === "string" ? "" : item.quantity || "",
              unit: typeof item === "string" ? "" : item.unit,
              purchased: false,
            }))
          : recipeData.ingredients.map((ing) => ({
              id: nanoid(),
              name: ing.name,
              quantity: ing.quantity || "",
              unit: ing.unit || "",
              purchased: false,
            }));

        const newRecipe: Recipe = {
          id: nanoid(),
          userId,
          threadId,
          title: recipeData.title,
          description: recipeData.description,
          servings: recipeData.servings,
          prepTimeMinutes: recipeData.prepTimeMinutes,
          marinateTimeMinutes: recipeData.marinateTimeMinutes,
          cookTimeMinutes: recipeData.cookTimeMinutes,
          category: recipeData.category || [],
          tags: recipeData.tags || [],
          ingredients: recipeData.ingredients,
          preparationSteps,
          cookingSteps,
          shoppingList,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFavorite: false,
        };

        await recipes.insertOne(newRecipe);
        savedRecipe = newRecipe;
        recipeCreated = true;

        // Update thread with recipe link and new status
        await threads.updateOne(
          { id: threadId, userId },
          {
            $set: {
              recipeId: newRecipe.id,
              status: "recipe_created",
              title: recipeData.title,
              messages: updatedMessages,
              updatedAt: new Date().toISOString(),
            },
          },
        );
      }
    }

    // Update thread with new messages
    if (!recipeCreated) {
      await threads.updateOne(
        { id: threadId, userId },
        {
          $set: {
            messages: updatedMessages,
            updatedAt: new Date().toISOString(),
          },
        },
      );
    }

    // Detect preferences (optional)
    let preferenceAdded: string | undefined;
    try {
      const detectedPreference = await detectPreference(message);
      if (detectedPreference) {
        preferenceAdded = detectedPreference;
      }
    } catch (error) {
      // Ignore preference detection errors
      console.error("Preference detection error:", error);
    }

    return res.status(200).json({
      success: true,
      message: userMessage,
      assistantMessage,
      recipe: savedRecipe,
      recipeCreated,
      preferenceAdded,
    });
  } catch (error) {
    console.error("Error in messages handler:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
