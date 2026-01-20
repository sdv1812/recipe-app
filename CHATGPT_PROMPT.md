## ChatGPT Prompt for Generating Recipe JSON

Copy this prompt to ChatGPT to generate recipes in the correct format:

---

**Prompt:**

Please generate a recipe in JSON format with the following structure:

```json
{
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "servings": 4,
  "prepTimeMinutes": 15,
  "marinateTimeMinutes": 0,
  "cookTimeMinutes": 30,
  "category": ["chicken", "indian", "curry"],
  "tags": ["spicy", "meal-prep", "high-protein"],
  "ingredients": [
    {
      "name": "Ingredient name",
      "quantity": "amount",
      "unit": "cups/tbsp/etc"
    }
  ],
  "preparationSteps": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "cookingSteps": [
    {
      "stepNumber": 1,
      "instruction": "Detailed cooking instruction",
      "duration": "10 minutes"
    }
  ],
  "shoppingList": [
    {
      "name": "Item name",
      "quantity": "amount",
      "unit": "unit"
    }
  ]
}
```

Please provide the recipe for: [YOUR DISH NAME]

Make sure to:
- Include all ingredients with specific quantities
- Break preparation into clear steps
- Include cooking steps with estimated durations
- Generate a shopping list based on ingredients

---

**Example Request:**
"Please generate a recipe in the above JSON format for Chicken Tikka Masala"

**Tips:**
- Be specific about the dish you want
- Mention any dietary restrictions or preferences
- Ask for variations if needed (e.g., "vegetarian version")
- Request serving size adjustments if needed
