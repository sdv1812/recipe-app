import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { Recipe, RecipeImport } from "../../../shared/types";

// Query Keys
export const queryKeys = {
  recipes: ["recipes"] as const,
  recipe: (id: string) => ["recipes", id] as const,
  user: ["user"] as const,
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
    onSuccess: (_, variables) => {
      // Invalidate both the specific recipe and the list
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
