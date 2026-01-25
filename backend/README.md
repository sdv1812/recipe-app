# RecipeApp API

Serverless API built with **TypeScript**, Vercel Edge Functions, MongoDB, and OpenAI.

## Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Set Up Environment Variables

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your credentials:
- `MONGODB_URI`: Get from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- `OPENAI_API_KEY`: Get from [OpenAI Platform](https://platform.openai.com/api-keys)

### 3. Run Locally

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Recipe Generation

**POST** `/api/generate-recipe`

Generate a new recipe using AI.

```json
{
  "prompt": "Create a spicy chicken tikka masala recipe"
}
```

**Response:**
```json
{
  "success": true,
  "recipe": {
    "title": "Chicken Tikka Masala",
    "ingredients": [...],
    ...
  }
}
```

---

### Recipe CRUD

**GET** `/api/recipes`

List all recipes. Optional query params:
- `userId`: Filter by user
- `isPublished`: Filter published recipes

**POST** `/api/recipes`

Create a new recipe.

**GET** `/api/recipes/[id]`

Get a specific recipe.

**PUT** `/api/recipes/[id]`

Update a recipe.

**DELETE** `/api/recipes/[id]`

Delete a recipe.

---

### AI Chat

**POST** `/api/chat/recipe`

Chat with AI to update a recipe.

```json
{
  "recipeId": "abc123",
  "message": "Make this spicier",
  "chatHistory": []
}
```

**Response:**
```json
{
  "success": true,
  "updatedRecipe": {...},
  "assistantMessage": "I've increased the spices..."
}
```

---

### Sharing

**POST** `/api/share/create`

Create a shareable link for a recipe.

```json
{
  "recipeId": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "shareUrl": "https://your-app.vercel.app/share/xyz789",
  "token": "xyz789"
}
```

**GET** `/api/share/[token]`

Get a shared recipe by token.

---

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

4. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Add `MONGODB_URI` and `OPENAI_API_KEY`

---

## Database Schema

### Recipes Collection

```javascript
{
  id: string,
  userId: string,
  title: string,
  description: string,
  ingredients: Array<Ingredient>,
  preparationSteps: Array<PreparationStep>,
  cookingSteps: Array<CookingStep>,
  category: string[],
  tags: string[],
  createdAt: string,
  updatedAt: string,
  isPublished: boolean,
  likes: number,
  isFavorite: boolean,
  aiChatHistory: Array<ChatMessage>
}
```

### Shares Collection

```javascript
{
  id: string,
  recipeId: string,
  token: string,
  createdAt: string,
  expiresAt: string (optional)
}
```

---

## Adding Authentication

When you're ready to add auth (Clerk, Supabase, etc.):

1. Install auth library:
```bash
npm install @clerk/clerk-sdk-node
```

2. Add middleware to verify tokens
3. Update handlers to use `req.auth.userId`
4. Replace `x-user-id` header with real auth

---

## Cost Optimization

- Using GPT-3.5-turbo (~$0.002/1k tokens)
- MongoDB free tier: 512MB storage
- Vercel free tier: 100k requests/month
- **Estimated cost: $1-2/month for MVP**

---

## Next Steps

1. ✅ Backend API setup complete
2. ⏳ Connect React Native app to API
3. ⏳ Add authentication (Clerk)
4. ⏳ Deploy to Vercel
5. ⏳ Add social features (comments, likes)
