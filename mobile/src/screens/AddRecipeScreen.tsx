import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { RecipeImport } from "../../../shared/types";
import RecipePreviewModal from "../components/RecipePreviewModal";
import ChatInterface from "../components/ChatInterface";
import Header from "../components/Header";
import { useCreateRecipe } from "../utils/queries";
import { api } from "../utils/api";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";

type AddRecipeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  recipe?: RecipeImport;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm here to help you create delicious recipes. Tell me what you'd like to cook!\n\nYou can say things like:\n• I want a healthy dinner recipe\n• Something quick with chicken\n• Vegetarian pasta under 30 minutes\n• Dessert for 4 people",
  timestamp: new Date().toISOString(),
};

export default function AddRecipeScreen() {
  const navigation = useNavigation<AddRecipeScreenNavigationProp>();
  const createMutation = useCreateRecipe();

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    WELCOME_MESSAGE,
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewRecipe, setPreviewRecipe] = useState<RecipeImport | null>(null);

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isGenerating) return;

    const message = userMessage.trim();
    setUserMessage("");
    setIsGenerating(true);

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prev) => [...prev, newUserMessage]);

    try {
      const recipeData = await api.generateRecipe(message);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Great! I've created a recipe for you: ${recipeData.title}\n\nTap the card below to preview it. You can save it to your library or ask me to modify it!`,
        timestamp: new Date().toISOString(),
        recipe: recipeData,
      };

      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I had trouble creating that recipe. ${error instanceof Error ? error.message : "Please try again or rephrase your request."}`,
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewRecipe = (recipe: RecipeImport) => {
    setPreviewRecipe(recipe);
  };

  const handleSaveRecipe = async (recipe: RecipeImport) => {
    try {
      await createMutation.mutateAsync(recipe);

      const confirmMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Perfect! "${recipe.title}" has been saved to your library. Would you like to create another recipe?`,
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, confirmMessage]);
      setPreviewRecipe(null);

      Alert.alert(
        "Recipe Saved!",
        `"${recipe.title}" has been added to your library.`,
        [{ text: "OK" }],
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to save recipe. Please try again.",
      );
    }
  };

  const handleDiscardRecipe = () => {
    const discardMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content:
        "No problem! Tell me what you'd like me to change about the recipe, or ask for something completely different.",
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prev) => [...prev, discardMessage]);
    setPreviewRecipe(null);
  };

  const renderRecipeCard = (message: ChatMessage) => {
    if (!message.recipe) return null;

    const totalTime =
      (message.recipe.prepTimeMinutes || 0) +
      (message.recipe.cookTimeMinutes || 0);

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => handlePreviewRecipe(message.recipe!)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {message.recipe.title}
          </Text>

          {message.recipe.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {message.recipe.description}
            </Text>
          )}

          <View style={styles.cardMeta}>
            {message.recipe.servings && (
              <Text style={styles.metaText}>
                {message.recipe.servings} servings
              </Text>
            )}
            {totalTime > 0 && (
              <>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.metaText}>{totalTime} min</Text>
              </>
            )}
          </View>

          <View style={styles.cardAction}>
            <Text style={styles.actionText}>Tap to review</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="AI Chef" subtitle="Create recipes with AI" />

      <ChatInterface
        chatHistory={chatHistory}
        userMessage={userMessage}
        isGenerating={isGenerating}
        placeholder="Describe the recipe you'd like..."
        onMessageChange={setUserMessage}
        onSendMessage={handleSendMessage}
        renderMessageExtras={renderRecipeCard}
      />

      {previewRecipe && (
        <RecipePreviewModal
          recipe={previewRecipe}
          visible={!!previewRecipe}
          onSave={handleSaveRecipe}
          onDiscard={handleDiscardRecipe}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  recipeCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    overflow: "hidden",
  },
  cardContent: {
    padding: Spacing.base,
  },
  cardTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.size.lg * Typography.lineHeight.tight,
  },
  cardDescription: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  metaText: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
  },
  metaDivider: {
    fontSize: Typography.size.xs,
    color: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  cardAction: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.primary,
    textAlign: "center",
  },
});
