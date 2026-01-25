import OpenAI from "openai";
import { Recipe, ChatMessage } from "../../shared/types";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Please define OPENAI_API_KEY environment variable");
    }

    // Trim whitespace/newlines from API key
    const apiKey = process.env.OPENAI_API_KEY.trim();

    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }

  return openaiClient;
}

export async function generateRecipe(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          systemPrompt ||
          "You are a professional chef and recipe writer. Generate detailed, accurate recipes in JSON format.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return completion.choices[0].message.content || "";
}

export async function updateRecipeWithChat(
  recipe: Recipe,
  userMessage: string,
  chatHistory: ChatMessage[] = [],
): Promise<string> {
  const openai = getOpenAIClient();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are a professional chef helping users refine recipes. 
Current recipe: ${JSON.stringify(recipe, null, 2)}

When the user requests changes, return the COMPLETE updated recipe in JSON format matching this structure:
{
  "title": "Recipe Name",
  "description": "Description",
  "servings": 4,
  "prepTimeMinutes": 15,
  "marinateTimeMinutes": 0,
  "cookTimeMinutes": 30,
  "category": ["main-course", "italian"],
  "tags": ["quick", "vegetarian"],
  "ingredients": [{"name": "Flour", "quantity": "2", "unit": "cups"}],
  "preparationSteps": ["Step 1", "Step 2"],
  "cookingSteps": ["Step 1", "Step 2"]
}

Only return valid JSON, no additional text.`,
    },
    ...chatHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    {
      role: "user",
      content: userMessage,
    },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  });

  return completion.choices[0].message.content || "";
}
