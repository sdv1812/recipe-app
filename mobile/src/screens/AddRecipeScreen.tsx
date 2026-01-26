import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { RecipeImport } from "../../../shared/types";
import { api } from "../utils/api";
import RecipePreviewModal from "../components/RecipePreviewModal";

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
  const scrollViewRef = useRef<ScrollView>(null);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    WELCOME_MESSAGE,
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewRecipe, setPreviewRecipe] = useState<RecipeImport | null>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatHistory]);

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

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === "user";

    return (
      <View key={message.id} style={styles.messageContainer}>
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.content}
          </Text>

          {message.recipe && (
            <TouchableOpacity
              style={styles.recipeCard}
              onPress={() => handlePreviewRecipe(message.recipe!)}
            >
              <View style={styles.recipeCardHeader}>
                <Text style={styles.recipeCardTitle}>
                  {message.recipe.title}
                </Text>
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
                <Text style={styles.recipeCardCTA}>
                  Tap to preview and save →
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 AI Chef</Text>
        <Text style={styles.headerSubtitle}>
          Chat to create your perfect recipe
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
      >
        {chatHistory.map((message) => renderMessage(message))}

        {isGenerating && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.typingText}>AI Chef is cooking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask for a recipe..."
          value={userMessage}
          onChangeText={setUserMessage}
          multiline
          maxLength={500}
          editable={!isGenerating}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!userMessage.trim() || isGenerating) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!userMessage.trim() || isGenerating}
        >
          <Text style={styles.sendButtonText}>
            {isGenerating ? "..." : "→"}
          </Text>
        </TouchableOpacity>
      </View>

      {previewRecipe && (
        <RecipePreviewModal
          recipe={previewRecipe}
          visible={!!previewRecipe}
          onSave={handleSaveRecipe}
          onDiscard={handleDiscardRecipe}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  assistantBubble: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    marginLeft: 8,
  },
  userTimestamp: {
    textAlign: "right",
    marginRight: 8,
    marginLeft: 0,
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
  typingContainer: {
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  typingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingBottom: 32,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
});
