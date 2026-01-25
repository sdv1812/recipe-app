import { getOpenAIClient } from "./openai";

/**
 * Use AI to detect if a message contains a food preference
 * Returns the preference if detected, null otherwise
 */
export async function detectPreference(
  message: string,
): Promise<string | null> {
  const openai = getOpenAIClient();

  const systemPrompt = `You are analyzing user messages to detect food preferences.

If the user is stating a dietary preference, restriction, or cooking style preference, extract it as a clear, concise statement.

Examples:
- "I don't like spicy food" → "no spicy food"
- "I'm vegetarian" → "vegetarian"
- "I prefer quick meals under 30 minutes" → "quick meals under 30 minutes"
- "Remember I'm allergic to nuts" → "no nuts (allergy)"
- "I love Italian cuisine" → "prefers Italian cuisine"
- "Make it healthier" → null (not a lasting preference)
- "Add more garlic" → null (recipe-specific change)

Return ONLY the extracted preference text, or the word "NONE" if no lasting preference is stated.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent detection
      max_tokens: 50,
    });

    const response = completion.choices[0].message.content?.trim();

    if (!response || response === "NONE" || response.length < 3) {
      return null;
    }

    return response;
  } catch (error) {
    console.error("Error detecting preference:", error);
    return null;
  }
}
