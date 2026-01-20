# Recipe App

A simple offline-first mobile app for storing and displaying recipes in a user-friendly format.

## Features

- 📱 Import recipes from JSON files
- 🍳 View recipes with formatted ingredients, prep steps, and cooking steps
- ✅ Interactive checklists for preparation and cooking
- 🛒 Shopping list with checkable items
- 💾 All data stored locally (no internet required)
- 📲 Works on iOS and Android

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Expo Go app on your mobile device

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## Usage

### Adding a Recipe

1. Tap "Add Recipe" on the home screen
2. Choose a JSON file with your recipe data
3. The recipe will be imported and saved locally

### Recipe JSON Format

See `sample-recipe.json` for a complete example. Basic structure:

```json
{
  "title": "Recipe Name",
  "description": "Optional description",
  "servings": 4,
  "totalTime": "30 minutes",
  "ingredients": [
    {
      "name": "Ingredient name",
      "quantity": "2",
      "unit": "cups"
    }
  ],
  "preparationSteps": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "cookingSteps": [
    {
      "stepNumber": 1,
      "instruction": "Cooking step",
      "duration": "10 minutes"
    }
  ]
}
```

### Viewing Recipes

- Tap any recipe card to view details
- Switch between tabs: Ingredients, Prep, Cooking, Shopping
- Tap checkboxes to mark steps as completed
- Long-press a recipe card to delete it

## Project Structure

```
RecipeApp/
├── src/
│   ├── navigation/
│   │   └── types.ts              # Navigation type definitions
│   ├── screens/
│   │   ├── HomeScreen.tsx        # Recipe list
│   │   ├── AddRecipeScreen.tsx   # JSON file import
│   │   └── RecipeDetailScreen.tsx # Recipe display
│   ├── types/
│   │   └── recipe.ts             # Data models
│   └── utils/
│       ├── storage.ts            # AsyncStorage helpers
│       └── recipeParser.ts       # JSON parsing logic
├── App.tsx                       # Main app entry
└── sample-recipe.json            # Example recipe format
```

## Technologies

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **AsyncStorage** for local data persistence
- **Expo Document Picker** for file selection

## License

MIT
