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

CRITICAL: You MUST return ONLY valid JSON with no extra text, markdown, or explanations.

Current recipe:
${JSON.stringify(recipe, null, 2)}

When the user requests changes, return the COMPLETE updated recipe in this EXACT JSON format:
{
  "title": "Recipe Name",
  "description": "Brief description",
  "servings": 4,
  "prepTimeMinutes": 15,
  "marinateTimeMinutes": 0,
  "cookTimeMinutes": 30,
  "category": ["main-course"],
  "tags": ["quick"],
  "ingredients": [
    {"name": "Ingredient name", "quantity": "2", "unit": "cups"}
  ],
  "preparationSteps": ["Step 1 text", "Step 2 text"],
  "cookingSteps": ["Step 1 text", "Step 2 text"]
}

RULES:
- Return ONLY the JSON object, nothing else
- Include ALL fields even if unchanged
- Ensure all JSON is properly formatted with no trailing commas
- Do not wrap in markdown code blocks
- Do not add any explanatory text before or after the JSON`,
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
    temperature: 0.5, // Lower temperature for more consistent JSON
    max_tokens: 2000,
    response_format: { type: "json_object" }, // Force JSON response
  });

  return completion.choices[0].message.content || "";
}
