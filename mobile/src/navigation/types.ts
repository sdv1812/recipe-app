import { Recipe } from "../../../shared/types";
import { NavigatorScreenParams } from "@react-navigation/native";

// Bottom Tab Navigator (3 tabs: Recipes, Groceries, More)
export type TabParamList = {
  MyRecipes: undefined;
  Groceries: undefined;
  More: undefined;
};

// Root Stack Navigator (for modals and auth)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  RecipeDetail: { recipeId: string; fromChat?: boolean };
  ChatModal: { threadId?: string; mode: "new" | "existing" }; // New chat modal
  Preferences: undefined;
  Settings: undefined;
  ImportJson: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
