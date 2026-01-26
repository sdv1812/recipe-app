import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { RecipeImport } from "../../../shared/types";
import { api } from "../utils/api";
import RecipePreviewModal from "../components/RecipePreviewModal";
import ChatInterface from "../components/ChatInterface";

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
    '👋 Hi! I\'m your AI Chef assistant. Tell me what you\'d like to cook today!\n\nYou can say things like:\n• "I want a healthy dinner recipe"\n• "Something quick with chicken"\n• "Vegetarian pasta under 30 minutes"\n• "Dessert for 4 people"',
  timestamp: new Date().toISOString(),
};

export default function AddRecipeScreen() {
  const navigation = useNavigation<AddRecipeScreenNavigationProp>();

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
        content: `Great! I've created a recipe for you: **${recipeData.title}**\n\nTap the card below to preview it. You can save it to your library or ask me to modify it!`,
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
      await api.createRecipe(recipe);

      const confirmMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Perfect! "${recipe.title}" has been saved to your library. Would you like to create another recipe?`,
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

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => handlePreviewRecipe(message.recipe!)}
      >
        <View style={styles.recipeCardHeader}>
          <Text style={styles.recipeCardTitle}>{message.recipe.title}</Text>
          <Text style={styles.recipeCardIcon}>👉</Text>
        </View>

        {message.recipe.description && (
          <Text style={styles.recipeCardDescription} numberOfLines={2}>
            {message.recipe.description}
          </Text>
        )}

        <View style={styles.recipeCardMeta}>
          {message.recipe.servings && (
            <Text style={styles.recipeCardMetaItem}>
              🍽️ {message.recipe.servings} servings
            </Text>
          )}
          {message.recipe.prepTimeMinutes && (
            <Text style={styles.recipeCardMetaItem}>
              ⏱️{" "}
              {message.recipe.prepTimeMinutes +
                (message.recipe.cookTimeMinutes || 0)}{" "}
              min
            </Text>
          )}
        </View>

        <View style={styles.recipeCardFooter}>
          <Text style={styles.recipeCardCTA}>Tap to preview and save →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ChatInterface
        chatHistory={chatHistory}
        userMessage={userMessage}
        isGenerating={isGenerating}
        placeholder="Ask for a recipe..."
        headerTitle="🤖 AI Chef"
        headerSubtitle="Chat to create your perfect recipe"
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
    backgroundColor: "#f5f5f5",
  },
  recipeCard: {
    marginTop: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  recipeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recipeCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  recipeCardIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  recipeCardDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  recipeCardMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  recipeCardMetaItem: {
    fontSize: 12,
    color: "#666",
  },
  recipeCardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
    marginTop: 4,
  },
  recipeCardCTA: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
  },
});
