export const CHATGPT_PROMPT = `Please generate a recipe in JSON format with the following structure:

{
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "servings": 4,
  "prepTimeMinutes": 15,
  "marinateTimeMinutes": 0,
  "cookTimeMinutes": 30,
  "category": ["main-course", "cuisine-type", "protein-type"],
  "tags": ["cooking-method", "dietary-info", "occasion"],
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

Please provide the recipe for: [YOUR DISH NAME HERE]

Make sure to:
- Include all ingredients with specific quantities
- Break preparation into clear steps
- Include cooking steps with estimated durations
- Generate a shopping list based on ingredients
- Use categories that describe the dish type (e.g., "pasta", "salad", "dessert", "breakfast")
- Use tags that describe cooking method, dietary info, or occasion (e.g., "quick", "vegetarian", "baked", "holiday")`;
