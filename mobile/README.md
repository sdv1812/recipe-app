# RecipeApp Mobile

Offline-first React Native mobile app for managing and viewing recipes.

## Features

- 📱 Import recipes via file upload or paste JSON
- ⭐ Favorite recipes and filter by favorites
- 🔍 Search by recipe name, ingredients, tags, or category
- 🍳 View recipes with tabbed interface (Ingredients, Prep, Cooking, Shopping)
- ✅ Interactive checklists for preparation and cooking steps
- 🛒 Shopping list with checkable items
- 💾 All data stored locally with AsyncStorage
- 📲 Share recipes via clipboard

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo Go app on your mobile device (iOS or Android)

### Installation

1. Navigate to mobile directory:

   ```bash
   cd mobile
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the Expo development server:

   ```bash
   npx expo start
   ```

4. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## Usage

### Adding Recipes

1. Tap "Add Recipe" button
2. Choose method:
   - **Paste JSON** (default): Paste recipe JSON directly
   - **Upload File**: Select a JSON file from device

### Recipe Format

Recipes follow this JSON structure:

```json
{
  "title": "Pasta Carbonara",
  "description": "Classic Italian pasta dish",
  "servings": 4,
  "prepTimeMinutes": 10,
  "cookTimeMinutes": 20,
  "marinateTimeMinutes": 0,
  "category": ["main-course", "italian"],
  "tags": ["pasta", "quick", "comfort-food"],
  "ingredients": [
    {
      "name": "Spaghetti",
      "quantity": "400",
      "unit": "g"
    }
  ],
  "preparationSteps": [
    "Bring large pot of salted water to boil",
    "Beat eggs with grated cheese"
  ],
  "cookingSteps": [
    "Cook pasta according to package directions",
    "Mix hot pasta with egg mixture"
  ]
}
```

### Viewing & Managing Recipes

- **Search**: Use search bar to filter by name, ingredients, tags, or category
- **Favorites**: Tap heart icon to favorite, use filter button to show only favorites
- **Recipe Details**: Tap any recipe card to view full details
- **Share**: Tap share button to copy recipe JSON to clipboard
- **Delete All**: Use "Clear All" button (requires confirmation)

## Project Structure

```
mobile/
├── src/
│   ├── constants/
│   │   └── prompts.ts           # ChatGPT prompt template
│   ├── navigation/
│   │   └── types.ts             # Navigation types
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Recipe list with search & favorites
│   │   ├── AddRecipeScreen.tsx  # Import recipes (paste/upload)
│   │   └── RecipeDetailScreen.tsx # Recipe details with tabs
│   ├── types/
│   │   └── recipe.ts            # Data models
│   └── utils/
│       ├── storage.ts           # AsyncStorage CRUD operations
│       ├── recipeParser.ts      # JSON validation
│       ├── recipeShare.ts       # Share functionality
│       └── timeFormatter.ts     # Time formatting helper
├── App.tsx                      # Main app entry
├── index.ts                     # Root component registration
└── package.json
```

## Technologies

- **Expo SDK 54** - React Native framework
- **TypeScript** - Type safety
- **React Navigation** - Native stack navigation
- **AsyncStorage** - Local data persistence
- **Expo Modules**: Document Picker, Clipboard, Sharing, File System

## Future Features (Backend Integration)

Once connected to the backend API:

- AI-powered recipe generation
- Cloud sync across devices
- User authentication
- Social features (publish, share, comments)
- Recipe modifications via AI chat

## Generating Recipes with ChatGPT

Use the built-in prompt template (tap "Copy ChatGPT Prompt") to generate recipes:

1. Copy the prompt
2. Open ChatGPT
3. Paste the prompt and describe your desired recipe
4. Copy the generated JSON
5. Return to app and paste in the JSON field

## License

MIT
