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
  userPreferences?: string[],
): Promise<string> {
  const openai = getOpenAIClient();

  let enhancedSystemPrompt =
    systemPrompt ||
    `You are a professional chef and recipe writer. Generate detailed, accurate recipes in JSON format.

CRITICAL: You MUST return ONLY valid JSON with no extra text, markdown, or explanations.

Return the recipe in this EXACT JSON format:
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
  "cookingSteps": [
    {"stepNumber": 1, "instruction": "Detailed instruction", "duration": "10 minutes"}
  ],
  "shoppingList": [
    {"name": "Item name", "quantity": "2", "unit": "cups"}
  ]
}

RULES:
- Return ONLY the JSON object, nothing else
- Use "title" NOT "recipeName"
- Ingredients MUST have: name, quantity, unit (NOT preparation)
- All fields are required
- Do not wrap in markdown code blocks`;

  // Add user preferences to the system prompt
  if (userPreferences && userPreferences.length > 0) {
    enhancedSystemPrompt += `\n\nUSER PREFERENCES (must follow these):\n${userPreferences.map((p) => `- ${p}`).join("\n")}`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: enhancedSystemPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: "json_object" }, // Force JSON mode
  });

  return completion.choices[0].message.content || "";
}

export async function getChatResponse(
  message: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<{ response: string; wantsRecipe: boolean }> {
  const openai = getOpenAIClient();

  const systemPrompt = `You are SousAI, a helpful cooking assistant. Your main purpose is to help users create recipes, but you can also have friendly conversations.

When users greet you or chat casually, respond naturally and friendly.
When users ask for a recipe or describe food they want, politely ask them to describe what they'd like to cook so you can create a recipe for them.

Keep responses concise and friendly. Don't be overly formal.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...chatHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    {
      role: "user",
      content: message,
    },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 0.8,
    max_tokens: 300,
  });

  const response = completion.choices[0].message.content || "";

  // Simple heuristic: check if user message contains recipe-related keywords
  const recipeKeywords = [
    "recipe",
    "cook",
    "make",
    "prepare",
    "ingredient",
    "dish",
    "meal",
    "dinner",
    "lunch",
    "breakfast",
    "dessert",
    "bake",
    "chicken",
    "pasta",
    "salad",
    "soup",
    "vegetarian",
    "vegan",
  ];

  const messageLower = message.toLowerCase();
  const wantsRecipe = recipeKeywords.some((keyword) =>
    messageLower.includes(keyword),
  );

  return { response, wantsRecipe };
}

export async function updateRecipeWithChat(
  recipe: Recipe,
  userMessage: string,
  chatHistory: ChatMessage[] = [],
  userPreferences?: string[],
): Promise<string> {
  const openai = getOpenAIClient();

  let systemContent = `You are a professional chef helping users refine recipes. 

CRITICAL: You MUST return ONLY valid JSON with no extra text, markdown, or explanations.

Current recipe:
${JSON.stringify(recipe, null, 2)}`;

  // Add user preferences
  if (userPreferences && userPreferences.length > 0) {
    systemContent += `\n\nUSER PREFERENCES (always respect these):\n${userPreferences.map((p) => `- ${p}`).join("\n")}`;
  }

  systemContent += `\n\nWhen the user requests changes, return the COMPLETE updated recipe in this EXACT JSON format:
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
- Do not add any explanatory text before or after the JSON`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemContent,
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
