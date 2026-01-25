import { Recipe } from "../types/recipe";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  AddRecipe: undefined;
  RecipeDetail: { recipeId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
