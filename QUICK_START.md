# Quick Start Guide - Chat Thread Feature

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Mobile
cd mobile
npm install
```

### 2. Setup MongoDB Collection

Add a `threads` collection to your MongoDB database. The backend will automatically create documents with the correct structure.

**Optional**: Add index for performance:

```javascript
db.threads.createIndex({ userId: 1, updatedAt: -1 });
db.threads.createIndex({ id: 1, userId: 1 }, { unique: true });
```

### 3. Deploy Backend (Vercel)

```bash
cd backend
vercel --prod
```

The new endpoints will be available at:

- `POST /api/threads`
- `GET /api/threads`
- `GET /api/threads/:id`
- `POST /api/threads/:id/messages`
- `PUT /api/threads/:id`
- `DELETE /api/threads/:id`

### 4. Test Backend Endpoints

```bash
# Create a thread
curl -X POST https://your-api.vercel.app/api/threads \
  -H "x-api-key: your-api-key" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Thread"}'

# Get all threads
curl https://your-api.vercel.app/api/threads \
  -H "x-api-key: your-api-key" \
  -H "Authorization: Bearer your-jwt-token"
```

### 5. Run Mobile App

```bash
cd mobile

# iOS
npx expo start --ios

# Android
npx expo start --android

# Web (for testing)
npx expo start --web
```

---

## 🧪 Manual Testing Flow

### Test 1: Create Recipe from New Chat

1. Open app → Go to "My Recipes" tab
2. Tap bottom composer ("Ask SousAI to create a recipe...")
3. Chat modal opens with suggestion chips
4. Tap a suggestion chip or type: "Quick chicken dinner"
5. Send message → See loading indicator
6. AI responds with recipe → Recipe auto-saves
7. Chat title updates from "New chat" to recipe title
8. Close chat → Recipe appears in "My Recipes" tab

**Expected**: Recipe created, no draft in Drafts tab

### Test 2: Save Draft (Chat without Recipe)

1. Tap bottom composer
2. Type: "What are some healthy cooking tips?"
3. Send message → AI responds with advice (no recipe JSON)
4. Close chat
5. Go to "Drafts" tab → See draft with message count
6. Tap draft → Reopens with message history

**Expected**: Draft appears, can be resumed

### Test 3: Edit Existing Recipe

1. Open any recipe from "My Recipes"
2. Tap "Edit with AI" button
3. Chat opens with previous conversation (if any)
4. Type: "Make it spicier"
5. Send → AI updates recipe
6. Recipe updates immediately

**Expected**: Same recipe updated, no duplicate created

### Test 4: Delete Draft

1. Go to "Drafts" tab
2. Long-press on a draft
3. Confirm deletion
4. Draft removed from list

**Expected**: Draft deleted, count updates

### Test 5: View Modes

1. Create some recipes and mark a few as favorites
2. Switch between tabs: Recipes | Drafts | Favorites
3. Search in Recipes tab
4. Verify counts update correctly

**Expected**: Each view shows correct items

---

## 🐛 Troubleshooting

### Issue: "Failed to create thread"

**Cause**: Backend endpoint not deployed or MongoDB connection issue  
**Fix**:

1. Check backend deployment: `vercel ls`
2. Verify MongoDB connection in Vercel dashboard
3. Check browser console for full error

### Issue: Messages not sending

**Cause**: OpenAI API key not set or rate limit  
**Fix**:

1. Verify `OPENAI_API_KEY` in Vercel env vars
2. Check OpenAI usage limits
3. Look at backend logs: `vercel logs`

### Issue: Recipe not appearing after creation

**Cause**: React Query cache not invalidating  
**Fix**:

1. Pull down to refresh on Home screen
2. Check if recipe was actually created in MongoDB
3. Verify `onSuccess` in `useSendMessage` hook

### Issue: "Edit with AI" opens new chat instead of existing thread

**Cause**: Recipe doesn't have `threadId` (old recipe)  
**Fix**: This is expected for recipes created before the update. They'll create a new thread on first edit.

### Issue: TypeScript errors in mobile app

**Cause**: Missing types after update  
**Fix**:

```bash
cd mobile
rm -rf node_modules
npm install
npx expo start --clear
```

### Issue: App crashes on opening ChatModal

**Cause**: Navigation parameter types mismatch  
**Fix**:

1. Check navigation params match `RootStackParamList`
2. Restart TypeScript server in VS Code
3. Clear metro bundler cache

---

## 📊 Verify Implementation

### Checklist

- [ ] Backend deployed successfully
- [ ] All 6 thread endpoints responding
- [ ] MongoDB `threads` collection exists
- [ ] Mobile app builds without errors
- [ ] Can create new chat from composer
- [ ] Recipe auto-saves on first valid response
- [ ] Drafts appear in Drafts tab
- [ ] Can edit existing recipe via "Edit with AI"
- [ ] Thread history persists correctly
- [ ] Can delete drafts
- [ ] Segmented control switches views
- [ ] Search works in Recipes tab
- [ ] Pull-to-refresh works
- [ ] Error handling shows user-friendly messages

---

## 🎯 Next Steps

Once basic functionality is verified:

1. **Add Toast Notifications**:
   - "Recipe saved!" when auto-saving
   - "Draft saved" when closing chat early

2. **Improve Error Messages**:
   - Specific errors for network issues
   - Retry button on failures

3. **Add Analytics** (optional):
   - Track chat sessions
   - Monitor recipe creation success rate
   - Measure time to first recipe

4. **Performance Optimization**:
   - Paginate thread messages for long conversations
   - Add optimistic updates for faster UI

5. **User Onboarding**:
   - Show tooltip on first app launch
   - Explain Drafts tab
   - Highlight bottom composer

---

## 📞 Need Help?

1. **Check Logs**:

   ```bash
   # Backend logs
   vercel logs

   # Mobile logs
   npx expo start
   # Then press 'j' to open debugger
   ```

2. **Common Error Patterns**:
   - 401: Authentication issue (check JWT token)
   - 404: Thread not found (verify ID)
   - 500: Server error (check backend logs)

3. **Debug React Query**:

   ```typescript
   // Add to App.tsx temporarily
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

   <QueryClientProvider client={queryClient}>
     <YourApp />
     <ReactQueryDevtools initialIsOpen={false} />
   </QueryClientProvider>
   ```

---

## ✅ Success Metrics

Your implementation is working correctly if:

1. ✅ Users can create recipes via chat
2. ✅ Drafts persist across app restarts
3. ✅ Recipe edits update the same recipe
4. ✅ Thread history loads correctly
5. ✅ Error states display properly
6. ✅ No console errors during normal usage
7. ✅ Performance feels smooth (no lag)
8. ✅ All TypeScript compiles without errors

---

**Ready to Launch!** 🎉

Your chat thread implementation is complete and ready for production testing.
