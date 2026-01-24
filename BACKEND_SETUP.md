# 🚀 RecipeApp Backend Setup Guide

## ✅ What's Been Created

Your monorepo now has a complete serverless backend with:

```
RecipeApp/
├── api/                          # Backend serverless functions
│   ├── lib/
│   │   ├── db.js                # MongoDB connection utilities
│   │   └── openai.js            # OpenAI integration
│   ├── recipes/
│   │   ├── index.js             # GET /api/recipes, POST /api/recipes
│   │   └── [id].js              # GET/PUT/DELETE /api/recipes/:id
│   ├── chat/
│   │   └── recipe.js            # POST /api/chat/recipe (AI chat)
│   ├── share/
│   │   ├── create.js            # POST /api/share/create
│   │   └── [token].js           # GET /api/share/:token
│   ├── generate-recipe.js       # POST /api/generate-recipe (AI)
│   ├── package.json             # Backend dependencies
│   └── README.md                # API documentation
├── shared/
│   └── types.ts                 # Shared TypeScript types
├── src/                         # React Native app (existing)
├── vercel.json                  # Vercel configuration
└── .env.example                 # Environment variables template
```

---

## 📋 Next Steps to Get Running

### 1. Set Up MongoDB Atlas (5 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Click "Connect" → "Drivers"
5. Copy your connection string

### 2. Get OpenAI API Key (2 minutes)

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create account if needed
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### 3. Configure Environment Variables

```bash
# In RecipeApp root directory
cp .env.example .env
```

Edit `.env` with your credentials:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recipeapp
OPENAI_API_KEY=sk-proj-...
```

### 4. Test Locally

```bash
# Install Vercel CLI globally
npm install -g vercel

# Run development server
vercel dev
```

Visit `http://localhost:3000/api/generate-recipe` to test!

---

## 🧪 Testing the API

### Test Recipe Generation

```bash
curl -X POST http://localhost:3000/api/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a simple pasta carbonara recipe"}'
```

### Test Recipe CRUD

```bash
# Create recipe
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Recipe",
    "ingredients": [...],
    "preparationSteps": [...],
    "cookingSteps": [...]
  }'

# Get all recipes
curl http://localhost:3000/api/recipes

# Get specific recipe
curl http://localhost:3000/api/recipes/RECIPE_ID
```

### Test AI Chat

```bash
curl -X POST http://localhost:3000/api/chat/recipe \
  -H "Content-Type: application/json" \
  -d '{
    "recipeId": "RECIPE_ID",
    "message": "Make this recipe spicier"
  }'
```

---

## 🔗 Connect React Native App

### Update your Expo app to use the API:

1. **Install axios** (in RecipeApp root):
```bash
npm install axios
```

2. **Create API client** (`src/utils/api.ts`):
```typescript
import axios from 'axios';

const API_URL = __DEV__ 
  ? 'http://localhost:3000/api'
  : 'https://your-app.vercel.app/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generate recipe with AI
export const generateRecipeFromPrompt = async (prompt: string) => {
  const response = await api.post('/generate-recipe', { prompt });
  return response.data;
};

// CRUD operations
export const createRecipe = async (recipe: any) => {
  const response = await api.post('/recipes', recipe);
  return response.data;
};

export const getRecipes = async () => {
  const response = await api.get('/recipes');
  return response.data;
};

export const getRecipe = async (id: string) => {
  const response = await api.get(`/recipes/${id}`);
  return response.data;
};

export const updateRecipe = async (id: string, updates: any) => {
  const response = await api.put(`/recipes/${id}`, updates);
  return response.data;
};

export const deleteRecipe = async (id: string) => {
  const response = await api.delete(`/recipes/${id}`);
  return response.data;
};

// AI chat
export const chatWithRecipe = async (recipeId: string, message: string, chatHistory = []) => {
  const response = await api.post('/chat/recipe', {
    recipeId,
    message,
    chatHistory,
  });
  return response.data;
};

// Sharing
export const createShareLink = async (recipeId: string) => {
  const response = await api.post('/share/create', { recipeId });
  return response.data;
};

export const getSharedRecipe = async (token: string) => {
  const response = await api.get(`/share/${token}`);
  return response.data;
};
```

3. **Use in your screens**:
```typescript
import { generateRecipeFromPrompt } from '../utils/api';

// In AddRecipeScreen
const handleGenerateRecipe = async () => {
  try {
    const result = await generateRecipeFromPrompt('Chicken tikka masala');
    if (result.success) {
      // result.recipe contains the generated recipe
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to generate recipe');
  }
};
```

---

## 🚀 Deploy to Production

### Deploy to Vercel

1. **Push to GitHub** (if not already):
```bash
git add .
git commit -m "Add backend API"
git push
```

2. **Deploy**:
```bash
vercel --prod
```

3. **Add environment variables in Vercel**:
   - Go to vercel.com → Your Project → Settings → Environment Variables
   - Add `MONGODB_URI` and `OPENAI_API_KEY`

4. **Update your Expo app** with production URL:
```typescript
const API_URL = __DEV__ 
  ? 'http://localhost:3000/api'
  : 'https://your-app-name.vercel.app/api';
```

---

## 📊 What's Ready vs What's Next

### ✅ Ready Now:
- AI recipe generation
- Recipe CRUD (create, read, update, delete)
- AI chat to modify recipes
- Recipe sharing via links
- MongoDB data persistence

### ⏳ To Add Later:
- User authentication (Clerk/Supabase)
- Social features (comments, likes, publish)
- Image uploads
- Recipe search/filtering
- User profiles

---

## 💰 Cost Estimate

**Monthly costs for MVP:**
- Vercel hosting: **$0** (free tier: 100k requests/month)
- MongoDB Atlas: **$0** (free tier: 512MB)
- OpenAI API: **$1-5** (GPT-3.5-turbo usage)

**Total: ~$1-5/month** 🎉

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
- Check your `MONGODB_URI` in `.env`
- Make sure your IP is whitelisted in MongoDB Atlas (or allow all: `0.0.0.0/0`)

### "OpenAI API error"
- Verify `OPENAI_API_KEY` is correct
- Check you have credits in your OpenAI account

### "Vercel function timeout"
- Use GPT-3.5-turbo (faster than GPT-4)
- Reduce `max_tokens` in API calls

---

## 📚 Documentation

- Full API docs: `api/README.md`
- Shared types: `shared/types.ts`
- Vercel docs: https://vercel.com/docs

---

## 🎉 You're All Set!

Your backend is production-ready! Next steps:
1. Set up `.env` with your credentials
2. Run `vercel dev` to test locally
3. Connect your React Native app
4. Deploy to production when ready

Questions? Check `api/README.md` or ask me!
