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
  ForgotPassword: undefined;
  ResetPassword: { token: string; email: string };
  ChangePassword: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  RecipeDetail: { recipeId: string; fromChat?: boolean };
  ChatModal: {
    threadId?: string;
    mode: "new" | "existing";
    initialAction?: "scan_recipe_ocr" | "scan_ingredients_image";
    initialImageData?: string;
    initialMessage?: string;
    showAttachmentSheet?: boolean;
  }; // New chat modal
  Preferences: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
