# SousAI - Recipe Management Platform

A full-stack recipe management platform with an offline-first mobile app and serverless backend API for AI-powered recipe generation and cloud sync.

## 🏗️ Architecture

**Monorepo Structure:**

```
RecipeApp/
├── mobile/          # Expo React Native app (iOS & Android)
├── backend/         # Vercel serverless API (TypeScript)
├── shared/          # Shared TypeScript types
├── sample-recipe.json
├── BACKEND_SETUP.md
└── README.md
```

## ✨ Features

### Mobile App (Offline-First)

- 📱 Import recipes via JSON file or paste
- ⭐ Favorite recipes with filter
- 🔍 Search by name, ingredient, tags, category
- 🍳 Tabbed recipe view (Ingredients, Prep, Cooking, Shopping)
- ✅ Interactive checklists for steps
- 💾 Local storage with AsyncStorage
- 📲 Share recipes via clipboard

### Backend API (Serverless)

- 🤖 AI recipe generation with OpenAI GPT-3.5
- 💬 Chat with AI to modify recipes
- 🗄️ MongoDB Atlas for cloud storage
- 🔗 Shareable recipe links
- 🚀 Deployed on Vercel Edge Functions
- 🔐 CORS-enabled for mobile access

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- MongoDB Atlas account (free tier)
- OpenAI API key
- Expo Go app (for mobile testing)

### 1. Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan QR code with:

- **iOS**: Camera app
- **Android**: Expo Go app

See [mobile/README.md](mobile/README.md) for detailed mobile app documentation.

### 2. Backend API

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and OpenAI API key

# Run locally
vercel dev
```

Backend will start at `http://localhost:3000`

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed backend setup instructions.

## 📡 API Endpoints

| Endpoint               | Method | Description                    |
| ---------------------- | ------ | ------------------------------ |
| `/api/generate-recipe` | POST   | Generate recipe from AI prompt |
| `/api/recipes`         | GET    | List all recipes               |
| `/api/recipes`         | POST   | Create new recipe              |
| `/api/recipes/:id`     | GET    | Get single recipe              |
| `/api/recipes/:id`     | PUT    | Update recipe                  |
| `/api/recipes/:id`     | DELETE | Delete recipe                  |
| `/api/chat/recipe`     | POST   | Modify recipe via AI chat      |
| `/api/share/create`    | POST   | Create shareable link          |
| `/api/share/:token`    | GET    | Get shared recipe              |

## 🧪 Testing the API

Generate a recipe with AI:

```bash
curl -X POST http://localhost:3000/api/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{"prompt": "healthy chicken salad"}'
```

Create a recipe manually:

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Recipe",
    "category": ["lunch"],
    "tags": ["quick"],
    "ingredients": [
      {"name": "Pasta", "quantity": "200", "unit": "g"}
    ],
    "preparationSteps": ["Boil water"],
    "cookingSteps": ["Cook pasta"]
  }'
```

## 🔧 Tech Stack

### Mobile

- **Expo SDK 54** - React Native framework
- **TypeScript** - Type safety
- **React Navigation 7** - Navigation
- **AsyncStorage** - Local persistence

### Backend

- **Vercel Edge Functions** - Serverless hosting
- **TypeScript** - Type-safe API
- **MongoDB Atlas** - NoSQL database
- **OpenAI GPT-3.5-turbo** - AI recipe generation
- **nanoid** - Unique ID generation

### Shared

- **TypeScript interfaces** - Shared types between mobile & backend

## 📦 Deployment

### Backend (Vercel)

```bash
cd backend
vercel --prod
```

### Mobile (Expo EAS)

```bash
cd mobile
npx eas build --platform ios
npx eas build --platform android
```

## 💰 Costs (MVP)

- **MongoDB Atlas**: Free tier (512 MB)
- **Vercel**: Free tier (100 GB bandwidth)
- **OpenAI API**: ~$0.002 per 1K tokens (~$1-5/month for MVP)
- **Total**: ~$1-5/month

## 🗺️ Roadmap

- [ ] Connect mobile app to backend API
- [ ] User authentication (Clerk/Supabase)
- [ ] Real-time sync across devices
- [ ] Social features (publish, comments, likes)
- [ ] Image upload for recipes
- [ ] Nutrition information
- [ ] Meal planning
- [ ] Grocery list export

## 📄 License

MIT

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!
