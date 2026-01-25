import { Recipe } from "../types/recipe";
import { NavigatorScreenParams } from "@react-navigation/native";

// Bottom Tab Navigator
export type TabParamList = {
  MyRecipes: undefined;
  AIChef: undefined;
};

// Root Stack Navigator (for modals and auth)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  RecipeDetail: { recipeId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
