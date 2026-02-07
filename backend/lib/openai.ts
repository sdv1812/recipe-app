import OpenAI from "openai";
import { Recipe, RecipeImport, ChatMessage } from "../../shared/types";

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
- Do not wrap in markdown code blocks

STEP CLASSIFICATION (IMPORTANT):
Keep all steps in chronological order. Classify each step as follows:
- preparationSteps: Cold prep work like chopping, mixing, marinating, measuring ingredients
- cookingSteps: Steps involving heat - pan, stove, oven, grill, boil, simmer, fry, bake, sauté
- If a step could be either, put it in cookingSteps
- Never leave both arrays empty - every recipe needs at least one step
- For simple recipes, it's OK if only cookingSteps has steps (but avoid putting ALL steps in preparationSteps)

Examples:
- "Chop onions" → preparationSteps
- "Mix marinade ingredients" → preparationSteps
- "Heat oil in a pan" → cookingSteps
- "Add onions and sauté for 5 minutes" → cookingSteps
- "Season with salt" → cookingSteps (happens during cooking)`;

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

/**
 * New simplified chat function that returns structured response
 * Returns { assistantText: string, recipeDraft: RecipeImport | null }
 */
export async function getChatWithRecipeDraft(
  message: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
  existingRecipe?: { id: string; title: string } | null,
  currentDraftRecipe?: RecipeImport | null,
): Promise<{ assistantText: string; recipeDraft: any | null }> {
  const openai = getOpenAIClient();

  const systemPrompt = `You are SousAI, a professional chef and cooking assistant.

${existingRecipe ? `CONTEXT: User is editing an existing saved recipe titled "${existingRecipe.title}".` : ""}
${currentDraftRecipe ? `CONTEXT: User has an UNSAVED draft recipe they are iterating on. Current draft recipe JSON:\n${JSON.stringify(currentDraftRecipe)}` : ""}

Your response MUST be a JSON object with this structure:
{
  "assistantText": "Your conversational response to the user",
  "recipeDraft": null or RecipeImport object
}

RULES FOR recipeDraft:
- Set recipeDraft to NULL for casual conversation, questions, or partial recipe discussions
- ONLY set recipeDraft when you have generated a COMPLETE, FULL recipe with all fields
${existingRecipe ? "- When editing, ONLY return recipeDraft if you're providing a complete updated version of the recipe" : "- When creating, ONLY return recipeDraft when the user has provided enough info for a complete recipe"}
- recipeDraft must be a valid RecipeImport object with: title, ingredients, preparationSteps, cookingSteps

CRITICAL CONVERSATION RULES:
- NEVER ask the user for confirmation like "Should I proceed?" or "Would you like me to ...".
- If the user asks to MODIFY a recipe (e.g., "make it spicier", "add garlic", "swap chicken for tofu") and you have either existingRecipe context OR currentDraftRecipe context, you MUST return a COMPLETE updated recipeDraft in the SAME response.
- If the user request is underspecified (e.g., "spicier" with no constraints), make reasonable defaults (e.g., add chili flakes + optional fresh chilies + a spicy sauce) and still return the updated recipeDraft.
- Only ask follow-up questions when a required constraint is missing that prevents a safe/valid recipeDraft.

RecipeImport schema:
{
  "title": "Recipe Name",
  "description": "Brief description",
  "servings": 4,
  "prepTimeMinutes": 15,
  "marinateTimeMinutes": 0,
  "cookTimeMinutes": 30,
  "category": ["main-course"],
  "tags": ["quick", "easy"],
  "ingredients": [{"name": "ingredient", "quantity": "2", "unit": "cups"}],
  "preparationSteps": ["Step 1 text", "Step 2 text"],
  "cookingSteps": ["Step 1 text", "Step 2 text"],
  "shoppingList": [{"name": "item", "quantity": "2", "unit": "cups"}]
}

STEP CLASSIFICATION (use in recipeDraft):
- preparationSteps: Cold prep (chop, mix, marinate, measure)
- cookingSteps: Heat-based (pan, stove, oven, boil, simmer, fry, bake, sauté)
- If unsure, put in cookingSteps
- Never leave both arrays empty

EXAMPLES:
User: "I want pasta carbonara"
Response: {"assistantText": "I'd love to help you make pasta carbonara! It's a classic Italian dish. Do you want the traditional version with guanciale, or would you prefer bacon? Also, how many servings?", "recipeDraft": null}

User: "Traditional, 4 servings"
Response: {"assistantText": "Perfect! Here's a traditional pasta carbonara for 4 servings.", "recipeDraft": {complete recipe object}}

${existingRecipe ? 'User: "Add more garlic"\nResponse: {"assistantText": "I\'ve increased the garlic in your recipe. Here\'s the updated version.", "recipeDraft": {complete updated recipe}}' : ""}
${currentDraftRecipe && !existingRecipe ? 'User: "Make it more spicy"\nResponse: {"assistantText": "Done — I\'ve made it spicier. Here\'s the updated recipe.", "recipeDraft": {complete updated recipe}}' : ""}

CRITICAL: Return ONLY valid JSON. No extra text, no markdown, no explanations outside the JSON.`;

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
    temperature: 0.4,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices[0].message.content || "{}";

  try {
    const parsed = JSON.parse(responseText);
    return {
      assistantText: parsed.assistantText || "I'm here to help you cook!",
      recipeDraft: parsed.recipeDraft || null,
    };
  } catch (error) {
    console.error("Failed to parse LLM response:", responseText);
    return {
      assistantText:
        "Sorry, I had trouble processing that. Could you try again?",
      recipeDraft: null,
    };
  }
}

export async function getRecipeTextResponse(
  message: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<string> {
  const openai = getOpenAIClient();

  const systemPrompt = `You are SousAI, a professional chef and cooking assistant.

When users ask for a recipe or describe food they want to cook, provide a detailed recipe in a conversational, readable text format.

Include:
- Recipe title and brief description
- Servings and cooking time
- List of ingredients with quantities
- Step-by-step preparation and cooking instructions

Format the recipe in a natural, easy-to-read way. Use clear paragraph breaks and bullet points where helpful.

IMPORTANT: After providing the complete recipe, ALWAYS end your response by asking:
"Would you like me to save this recipe to your collection?"

Keep the tone friendly and professional.`;

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
    temperature: 0.7,
    max_tokens: 800,
  });

  return completion.choices[0].message.content || "";
}

export async function getRecipeModificationTextResponse(
  message: string,
  currentRecipeTitle: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<string> {
  const openai = getOpenAIClient();

  const systemPrompt = `You are SousAI, a professional chef helping users modify their saved recipe: "${currentRecipeTitle}".

The user is requesting changes to this recipe. Provide the MODIFIED recipe in a conversational, readable text format based on their request.

Include:
- Updated recipe title (if name changed) and description
- Servings and cooking time
- Complete list of ingredients with quantities (showing what changed)
- Updated step-by-step preparation and cooking instructions

Format the modified recipe in a natural, easy-to-read way. Use clear paragraph breaks and bullet points.

CRITICAL RULE - YOU MUST FOLLOW THIS:
After providing the complete modified recipe, you MUST ALWAYS end your response with this EXACT question:
"Would you like me to update your saved recipe with these changes?"

Do NOT skip this question. Do NOT rephrase it. Ask it EXACTLY as written above.

Keep the tone friendly and professional.`;

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
    temperature: 0.7,
    max_tokens: 800,
  });

  return completion.choices[0].message.content || "";
}

export async function getChatResponse(
  message: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<{
  response: string;
  wantsRecipe: boolean;
  userConfirmedSave: boolean;
  userConfirmedUpdate: boolean;
}> {
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

  // Check if user message contains recipe-related keywords
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
    "without",
    "substitute",
    "replace",
    "instead of",
    // Modification keywords
    "remove",
    "add",
    "change",
    "modify",
    "update",
    "less",
    "more",
    "extra",
    "skip",
    "omit",
    "use",
    "try",
    "swap",
    "different",
  ];

  // Check if user is confirming to save a recipe
  const confirmKeywords = [
    "yes",
    "yeah",
    "sure",
    "ok",
    "okay",
    "save",
    "save it",
    "save this",
    "save the recipe",
    "please save",
    "go ahead",
    "sounds good",
    "that works",
    "perfect",
  ];

  const messageLower = message.toLowerCase().trim();
  const wantsRecipe = recipeKeywords.some((keyword) =>
    messageLower.includes(keyword),
  );
  const userConfirmedSave = confirmKeywords.some((keyword) =>
    messageLower.includes(keyword),
  );
  const userConfirmedUpdate = confirmKeywords.some((keyword) =>
    messageLower.includes(keyword),
  );

  return { response, wantsRecipe, userConfirmedSave, userConfirmedUpdate };
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
