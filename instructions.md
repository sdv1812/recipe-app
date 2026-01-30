You are working inside my existing SousAI codebase. You already know the tech stack, current screens, navigation, data models, and how my app currently works. Your task is NOT to redesign from scratch — it is to EDIT my current screens and flows to implement the new “Chat thread == Recipe workspace” approach while preserving my current clean blue/neutral design system.

HIGH-LEVEL GOAL
Replace the separate “AI Chef” tab/screen with a unified Home experience like “ChatGPT projects”:

- Home shows a list of saved Recipes (existing)
- Add a bottom composer (“Ask SousAI…”) on Home
- Tapping the composer opens a bottom sheet / modal Chat screen that starts a NEW thread (fresh context)
- When the chat produces a VALID recipe for the first time, automatically create/save a recipe and rename the thread title to the recipe title
- Further chat messages in that same thread continue to update the same recipe
- Opening a recipe goes to the existing Recipe Details screen
- “Edit with AI” on Recipe Details opens the SAME chat thread for that recipe (reusable chat component)

CRITICAL RULE
Do NOT pollute the Recipes list with chats that never generated a recipe.
Instead, support “Drafts”:

- A chat thread can exist without a recipe (Draft)
- Drafts appear under a “Drafts” section on Home (or optionally hidden behind a filter), but implement Draft support.

DESIGN / UI CONSTRAINTS (KEEP CURRENT THEME)

- Keep current typography, spacing, card style, and primary blue color.
- Do not introduce new colors or playful icons.
- Red is only for destructive actions (delete/clear). “Ask for Changes” is not destructive; make it neutral/outline.
- Keep the same tab bar and current icons (but remove AI Chef tab and re-balance tabs accordingly).

WHAT TO CHANGE (SCREEN-BY-SCREEN)

1. TAB BAR / NAVIGATION

- Remove “AI Chef” tab entirely.
- Decide the new tab layout using existing screens:
  - My Recipes (Home)
  - Groceries
  - More
    (If you need a 4th tab, use Favorites or Search, but prefer 3 tabs if it simplifies.)
- Update navigation routes accordingly and remove dead links.

2. HOME SCREEN (formerly “My Recipes” list)
   Update this screen to behave like a “workspace list”:

- Top: Title “Recipes” + recipe count
- Keep Search bar
- Add segmented control or filter chips near top:
  - “Recipes” (default)
  - “Drafts”
  - “Favorites” (optional)
- Add a small “Drafts (n)” section when Drafts exist (if not using a segmented control).
- Keep recipe cards unchanged.
- Draft cards:
  - Title = thread title if available else “New chat”
  - Subtitle = “No recipe created yet”
  - Tap opens the chat thread (modal/bottom sheet).
- Add bottom composer (persistent, above tab bar):
  - Placeholder: “Ask SousAI to create a recipe…”
  - Tapping opens NEW thread chat modal.
  - Should not steal focus/keyboard on Home until tapped.
- Add “New chat” icon button (optional) next to composer for quick access.

3. CHAT MODAL / BOTTOM SHEET (NEW REUSABLE COMPONENT)
   Implement a reusable Chat component that can be opened in two modes:

- Mode A: NewThread (fresh chat)
- Mode B: ExistingThread (resume draft or recipe thread)

Chat UI requirements (keep current style):

- Header:
  - Left: close (X) or back
  - Center: thread title (“New chat” until recipe created; then recipe title)
  - Right: optional overflow menu (⋯)
- Body: message list with pagination (if needed)
- Input: composer with send icon
- System hints:
  - On empty chat, show 2–4 suggestion chips (“Quick dinner”, “Chicken + rice”, “High protein”, “Under 20 min”) instead of long paragraphs.

Chat behavior rules:

- Always create/save the thread immediately when chat opens in NewThread mode (so it can be resumed if user closes).
- Each send:
  - append user message
  - call backend for assistant response
  - append assistant message
- When assistant response contains a VALID recipe (first time in this thread):
  - create recipe
  - update thread.status to recipe_created
  - update thread.title = recipe.title
  - UI should immediately show a lightweight “Recipe saved” toast/snackbar (not a blocking modal).
- When recipe already exists for thread:
  - edits should update the same recipe
  - optionally store a recipe version snapshot
- If assistant response is NOT a recipe (general advice):
  - keep as Draft thread
  - do not create a recipe
  - show nothing special
- If assistant output is invalid JSON / cannot be parsed:
  - show a friendly error assistant message (“I couldn’t format that as a recipe. Try again.”)
  - keep thread as Draft
  - store error marker in message metadata

4. RECIPE DETAILS SCREEN
   Keep existing UI, but adjust actions:

- “Edit with AI” should open Chat modal in ExistingThread mode using threadId linked to the recipe.
- Ensure the edit chat includes the previous chat history for that recipe thread.
- Keep “Share” and “Favorite”.
- Ensure “Ask for Changes” labels aren’t red unless destructive.

5. EDIT WITH AI FULL-SCREEN / MODAL
   If you already have a separate “Edit recipe chat” screen/modal, delete it and reuse the new Chat modal component.
   The Chat modal should be the single source of truth for creating + editing.

6. GROCERY LIST
   No major redesign required.
   But ensure:

- From Recipe Details → Shopping tab → “Add selected to Grocery List” should work (if present).
- If not present, add a small button that adds checked items to grocery list.

PRODUCT / DATA RULES (IMPLEMENT IN UI + API CALLS)

- Thread status:
  - draft (no recipe yet)
  - recipe_created (recipe exists)
  - archived (optional)
- Thread title:
  - “New chat” until recipe created
  - then becomes recipe title
- Home should show:
  - Recipes list from recipes collection
  - Drafts list from threads where status=draft
- Deleting:
  - “Clear All recipes” is destructive → confirm dialog
  - Drafts: allow swipe delete or “Delete draft” in menu
  - If user deletes a recipe, also delete linked thread OR keep in trash; pick ONE behavior and implement consistently (prefer deleting both for simplicity).

EDGE CASES (MUST HANDLE)

- User opens new chat, sends messages, closes before recipe exists → thread saved as Draft; visible in Drafts.
- User sends two messages quickly → disable send until response returns OR queue messages properly.
- Assistant gives general cooking advice → remains Draft; no recipe created.
- Recipe created, then user asks something unrelated in same thread → keep in same thread (workspace), but do not create new recipe.
- User wants a different recipe variant:
  - Add “Start new chat” action in thread menu to fork a new thread (optional).
- If the assistant produces recipe but title is empty/invalid → fallback title: “Untitled recipe”.

DELIVERABLES
Make the changes directly in the codebase:

1. Update navigation to remove AI Chef tab and routes.
2. Modify Home screen to include:
   - Drafts support
   - bottom composer that opens chat modal
3. Build reusable Chat modal component with NewThread and ExistingThread modes.
4. Hook Recipe Details “Edit with AI” to open chat modal for that thread.
5. Ensure state management is correct (loading, errors, optimistic UI where safe).
6. Keep styling consistent with my current theme.

OUTPUT FORMAT

- Provide a step-by-step implementation plan (ordered commits)
- For each step, list files to modify/create
- Provide the actual code changes (TypeScript/React Native) with full components where feasible
- Call out any required backend endpoint changes only if strictly needed (otherwise adapt to existing endpoints)
- Include UX behavior notes for each screen (what user sees)

Remember: do not propose a brand new app. Edit what exists.
