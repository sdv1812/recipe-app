import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { Recipe, RecipeImport, GroceryItem } from "../../../shared/types";

// Query Keys
export const queryKeys = {
  recipes: ["recipes"] as const,
  recipe: (id: string) => ["recipes", id] as const,
  user: ["user"] as const,
  groceries: ["groceries"] as const,
};

// Queries
export function useRecipes() {
  return useQuery({
    queryKey: queryKeys.recipes,
    queryFn: () => api.getAllRecipes(),
  });
}

export function useRecipe(recipeId: string) {
  return useQuery({
    queryKey: queryKeys.recipe(recipeId),
    queryFn: () => api.getRecipeById(recipeId),
    enabled: !!recipeId,
  });
}

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => api.getCurrentUser(),
    staleTime: 1000 * 60 * 10, // User data is fresh for 10 minutes
  });
}

// Mutations
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipe: RecipeImport) => api.createRecipe(recipe),
    onSuccess: () => {
      // Invalidate recipes list to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      updates,
    }: {
      recipeId: string;
      updates: Partial<Recipe>;
    }) => api.updateRecipe(recipeId, updates),
    // Optimistic update for instant UI feedback
    onMutate: async ({ recipeId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.recipe(recipeId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.recipes });

      // Snapshot previous values
      const previousRecipe = queryClient.getQueryData<Recipe>(
        queryKeys.recipe(recipeId),
      );
      const previousRecipes = queryClient.getQueryData<Recipe[]>(
        queryKeys.recipes,
      );

      // Optimistically update the single recipe
      if (previousRecipe) {
        queryClient.setQueryData<Recipe>(queryKeys.recipe(recipeId), {
          ...previousRecipe,
          ...updates,
        });
      }

      // Optimistically update the recipes list
      if (previousRecipes) {
        queryClient.setQueryData<Recipe[]>(queryKeys.recipes, (old = []) =>
          old.map((recipe) =>
            recipe.id === recipeId ? { ...recipe, ...updates } : recipe,
          ),
        );
      }

      return { previousRecipe, previousRecipes };
    },
    // Rollback on error
    onError: (err, { recipeId }, context) => {
      if (context?.previousRecipe) {
        queryClient.setQueryData(
          queryKeys.recipe(recipeId),
          context.previousRecipe,
        );
      }
      if (context?.previousRecipes) {
        queryClient.setQueryData(queryKeys.recipes, context.previousRecipes);
      }
    },
    // Always refetch after error or success to sync with server
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipe(variables.recipeId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) => api.deleteRecipe(recipeId),
    onSuccess: () => {
      // Invalidate recipes list to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
    },
  });
}

export function useChatWithRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      message,
      history,
    }: {
      recipeId: string;
      message: string;
      history: any[];
    }) => api.chatWithRecipe(recipeId, message, history),
    onSuccess: (_, variables) => {
      // Invalidate the specific recipe to show updated version
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipe(variables.recipeId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
    },
  });
}

// Grocery Queries
export function useGroceries() {
  return useQuery({
    queryKey: queryKeys.groceries,
    queryFn: () => api.getGroceries(),
  });
}

export function useAddToGroceries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      items,
      recipeId,
    }: {
      items: Array<{ name: string; quantity?: string; unit?: string }>;
      recipeId?: string;
    }) => api.addToGroceries(items, recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries });
    },
  });
}

export function useToggleGroceryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.toggleGroceryItem(itemId),
    // Optimistic update for instant UI feedback
    onMutate: async (itemId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.groceries });

      // Snapshot the previous value
      const previousGroceries = queryClient.getQueryData<GroceryItem[]>(
        queryKeys.groceries,
      );

      // Optimistically update the cache
      queryClient.setQueryData<GroceryItem[]>(
        queryKeys.groceries,
        (old = []) => {
          return old.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  completed: !item.completed,
                  completedAt: !item.completed
                    ? new Date().toISOString()
                    : undefined,
                }
              : item,
          );
        },
      );

      // Return context with previous data for rollback
      return { previousGroceries };
    },
    // Rollback on error
    onError: (err, itemId, context) => {
      if (context?.previousGroceries) {
        queryClient.setQueryData(
          queryKeys.groceries,
          context.previousGroceries,
        );
      }
    },
    // Always refetch after error or success to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries });
    },
  });
}

export function useDeleteGroceryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.deleteGroceryItem(itemId),
    // Optimistic update for instant UI feedback
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.groceries });

      const previousGroceries = queryClient.getQueryData<GroceryItem[]>(
        queryKeys.groceries,
      );

      // Optimistically remove the item
      queryClient.setQueryData<GroceryItem[]>(queryKeys.groceries, (old = []) =>
        old.filter((item) => item.id !== itemId),
      );

      return { previousGroceries };
    },
    onError: (err, itemId, context) => {
      if (context?.previousGroceries) {
        queryClient.setQueryData(
          queryKeys.groceries,
          context.previousGroceries,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries });
    },
  });
}

export function useClearCompletedGroceries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.clearCompletedGroceries(),
    // Optimistic update for instant UI feedback
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.groceries });

      const previousGroceries = queryClient.getQueryData<GroceryItem[]>(
        queryKeys.groceries,
      );

      // Optimistically remove completed items
      queryClient.setQueryData<GroceryItem[]>(queryKeys.groceries, (old = []) =>
        old.filter((item) => !item.completed),
      );

      return { previousGroceries };
    },
    onError: (err, variables, context) => {
      if (context?.previousGroceries) {
        queryClient.setQueryData(
          queryKeys.groceries,
          context.previousGroceries,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries });
    },
  });
}
