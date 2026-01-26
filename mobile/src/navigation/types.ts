import { Recipe } from "../../../shared/types";
import { NavigatorScreenParams } from "@react-navigation/native";

// Bottom Tab Navigator
export type TabParamList = {
  MyRecipes: undefined;
  AIChef: undefined;
  Groceries: undefined;
  More: undefined;
};

// Root Stack Navigator (for modals and auth)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  RecipeDetail: { recipeId: string };
  Preferences: undefined;
  Settings: undefined;
  ImportJson: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
