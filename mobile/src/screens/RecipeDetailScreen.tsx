import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Recipe, ChatMessage } from "../types/recipe";
import { api } from "../utils/api";
import { shareRecipe } from "../utils/recipeShare";

type RecipeDetailRouteProp = RouteProp<RootStackParamList, "RecipeDetail">;
type RecipeDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "RecipeDetail"
>;

export default function RecipeDetailScreen() {
  const navigation = useNavigation<RecipeDetailNavigationProp>();
  const route = useRoute<RecipeDetailRouteProp>();
  const { recipeId } = route.params;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "ingredients" | "prep" | "cooking" | "shopping"
  >("ingredients");
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  useEffect(() => {
    // Load chat history from recipe
    if (recipe?.aiChatHistory) {
      setChatHistory(recipe.aiChatHistory);
    }
  }, [recipe]);

  const loadRecipe = async () => {
    try {
      const loadedRecipe = await api.getRecipeById(recipeId);
      setRecipe(loadedRecipe);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Recipe not found",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleStepCompletion = async (
    type: "prep" | "cooking",
    stepNumber: number,
  ) => {
    if (!recipe) return;

    const updatedRecipe = { ...recipe };

    if (type === "prep") {
      const step = updatedRecipe.preparationSteps.find(
        (s) => s.stepNumber === stepNumber,
      );
      if (step) step.completed = !step.completed;
    } else {
      const step = updatedRecipe.cookingSteps.find(
        (s) => s.stepNumber === stepNumber,
      );
      if (step) step.completed = !step.completed;
    }

    try {
      await api.updateRecipe(recipe.id, updatedRecipe);
      setRecipe(updatedRecipe);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update recipe",
      );
    }
  };

  const toggleShoppingItem = async (itemId: string) => {
    if (!recipe) return;

    const updatedRecipe = { ...recipe };
    const item = updatedRecipe.shoppingList.find((i) => i.id === itemId);
    if (item) {
      item.purchased = !item.purchased;
    }

    try {
      await api.updateRecipe(recipe.id, updatedRecipe);
      setRecipe(updatedRecipe);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update recipe",
      );
    }
  };

  const formatTimeBreakdown = () => {
    if (!recipe) return "";
    const times: string[] = [];
    if (recipe.prepTimeMinutes) times.push(`Prep: ${recipe.prepTimeMinutes}m`);
    if (recipe.marinateTimeMinutes) {
      const hours = Math.floor(recipe.marinateTimeMinutes / 60);
      const mins = recipe.marinateTimeMinutes % 60;
      if (hours > 0) {
        times.push(`Marinate: ${hours}h${mins > 0 ? ` ${mins}m` : ""}`);
      } else {
        times.push(`Marinate: ${mins}m`);
      }
    }
    if (recipe.cookTimeMinutes) times.push(`Cook: ${recipe.cookTimeMinutes}m`);
    return times.join(" | ");
  };

  const handleShare = async () => {
    if (!recipe) return;

    try {
      await shareRecipe(recipe);
    } catch (error) {
      Alert.alert("Share Failed", "Could not share recipe. Please try again.");
    }
  };

  const handleToggleFavorite = async () => {
    if (!recipe) return;

    try {
      const updatedRecipe = { ...recipe, isFavorite: !recipe.isFavorite };
      await api.updateRecipe(recipe.id, updatedRecipe);
      setRecipe(updatedRecipe);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Could not update favorite status",
      );
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() || !recipe || isChatting) return;

    const userMessage = chatMessage.trim();
    setChatMessage("");
    setIsChatting(true);

    try {
      // Add user message to chat history immediately
      const newUserMessage: ChatMessage = {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      const updatedHistory = [...chatHistory, newUserMessage];
      setChatHistory(updatedHistory);

      // Call API to update recipe
      const response = await api.chatWithRecipe(
        recipe.id,
        userMessage,
        chatHistory,
      );

      // Add AI response to chat history
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: response.message,
        timestamp: new Date().toISOString(),
      };
      setChatHistory([...updatedHistory, aiMessage]);

      // Update recipe with new data
      setRecipe(response.recipe);

      Alert.alert(
        "Recipe Updated",
        "Your recipe has been updated based on your request!",
      );
    } catch (error) {
      Alert.alert(
        "Chat Error",
        error instanceof Error
          ? error.message
          : "Failed to process your request",
      );
      // Remove the user message if failed
      setChatHistory(chatHistory);
    } finally {
      setIsChatting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text>Recipe not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => setShowChatModal(true)}
          >
            <Text style={styles.chatButtonText}>🤖 AI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
          >
            <Text style={styles.favoriteButtonText}>
              {recipe.isFavorite ? "❤️" : "🤍"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Share 📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}
          <View style={styles.metadata}>
            {recipe.servings && (
              <Text style={styles.metadataItem}>
                🍽️ {recipe.servings} servings
              </Text>
            )}
            {formatTimeBreakdown() && (
              <Text style={styles.metadataItem}>
                ⏱️ {formatTimeBreakdown()}
              </Text>
            )}
          </View>
          {recipe.category.length > 0 && (
            <View style={styles.chipsContainer}>
              <Text style={styles.chipsLabel}>Categories:</Text>
              <View style={styles.chipsWrapper}>
                {recipe.category.map((cat, index) => (
                  <View key={index} style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {recipe.tags.length > 0 && (
            <View style={styles.chipsContainer}>
              <Text style={styles.chipsLabel}>Tags:</Text>
              <View style={styles.chipsWrapper}>
                {recipe.tags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "ingredients" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("ingredients")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "ingredients" && styles.activeTabText,
              ]}
            >
              Ingredients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "prep" && styles.activeTab]}
            onPress={() => setActiveTab("prep")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "prep" && styles.activeTabText,
              ]}
            >
              Prep
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "cooking" && styles.activeTab]}
            onPress={() => setActiveTab("cooking")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "cooking" && styles.activeTabText,
              ]}
            >
              Cooking
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "shopping" && styles.activeTab]}
            onPress={() => setActiveTab("shopping")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "shopping" && styles.activeTabText,
              ]}
            >
              Shopping
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === "ingredients" && (
            <View>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientBullet}>•</Text>
                  <Text style={styles.ingredientText}>
                    {ingredient.quantity} {ingredient.unit || ""}{" "}
                    {ingredient.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === "prep" && (
            <View>
              {recipe.preparationSteps.map((step) => (
                <TouchableOpacity
                  key={step.stepNumber}
                  style={styles.stepItem}
                  onPress={() => toggleStepCompletion("prep", step.stepNumber)}
                >
                  <Text style={styles.stepCheckbox}>
                    {step.completed ? "✅" : "⬜"}
                  </Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepNumber}>
                      Step {step.stepNumber}
                    </Text>
                    <Text
                      style={[
                        styles.stepText,
                        step.completed && styles.completedText,
                      ]}
                    >
                      {step.instruction}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === "cooking" && (
            <View>
              {recipe.cookingSteps.map((step) => (
                <TouchableOpacity
                  key={step.stepNumber}
                  style={styles.stepItem}
                  onPress={() =>
                    toggleStepCompletion("cooking", step.stepNumber)
                  }
                >
                  <Text style={styles.stepCheckbox}>
                    {step.completed ? "✅" : "⬜"}
                  </Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepNumber}>
                      Step {step.stepNumber}
                    </Text>
                    <Text
                      style={[
                        styles.stepText,
                        step.completed && styles.completedText,
                      ]}
                    >
                      {step.instruction}
                    </Text>
                    {step.duration && (
                      <Text style={styles.stepDuration}>
                        ⏱️ {step.duration}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === "shopping" && (
            <View>
              {recipe.shoppingList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.shoppingItem}
                  onPress={() => toggleShoppingItem(item.id)}
                >
                  <Text style={styles.stepCheckbox}>
                    {item.purchased ? "✅" : "⬜"}
                  </Text>
                  <Text
                    style={[
                      styles.shoppingText,
                      item.purchased && styles.completedText,
                    ]}
                  >
                    {item.quantity} {item.unit || ""} {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* AI Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowChatModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setShowChatModal(false)}>
              <Text style={styles.chatCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.chatTitle}>Chat with AI</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView style={styles.chatMessages}>
            <View style={styles.chatWelcome}>
              <Text style={styles.chatWelcomeText}>🤖</Text>
              <Text style={styles.chatWelcomeMessage}>
                Ask me to modify your recipe! For example:{"\n\n"}• "Make it
                less spicy"{"\n"}• "Add more vegetables"{"\n"}• "Make it vegan"
                {"\n"}• "Reduce cooking time"
              </Text>
            </View>

            {chatHistory.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.chatBubble,
                  msg.role === "user"
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.chatBubbleText,
                    msg.role === "user" && styles.userBubbleText,
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            ))}

            {isChatting && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.typingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask AI to modify your recipe..."
              value={chatMessage}
              onChangeText={setChatMessage}
              multiline
              maxLength={500}
              editable={!isChatting}
            />
            <TouchableOpacity
              style={[
                styles.chatSendButton,
                (!chatMessage.trim() || isChatting) &&
                  styles.chatSendButtonDisabled,
              ]}
              onPress={handleSendChatMessage}
              disabled={!chatMessage.trim() || isChatting}
            >
              <Text style={styles.chatSendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteButtonText: {
    fontSize: 24,
  },
  shareButton: {
    padding: 8,
    paddingHorizontal: 12,
  },
  shareButtonText: {
    fontSize: 16,
    color: "#2196F3",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
    lineHeight: 22,
  },
  metadata: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  metadataItem: {
    fontSize: 14,
    color: "#999",
  },
  chipsContainer: {
    marginBottom: 12,
  },
  chipsLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    marginBottom: 6,
  },
  chipsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryChipText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },
  tagChip: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagChipText: {
    fontSize: 12,
    color: "#1565C0",
    fontWeight: "500",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#4CAF50",
  },
  tabText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#4CAF50",
  },
  tabContent: {
    padding: 20,
  },
  ingredientItem: {
    flexDirection: "row",
    paddingVertical: 8,
    alignItems: "flex-start",
  },
  ingredientBullet: {
    fontSize: 20,
    marginRight: 12,
    color: "#4CAF50",
  },
  ingredientText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  stepItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "flex-start",
  },
  stepCheckbox: {
    fontSize: 24,
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepNumber: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    marginBottom: 4,
  },
  stepText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  stepDuration: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  shoppingItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  shoppingText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  chatButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  chatCloseButton: {
    fontSize: 28,
    color: "#666",
    width: 30,
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  chatWelcome: {
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  chatWelcomeText: {
    fontSize: 32,
    marginBottom: 8,
  },
  chatWelcomeMessage: {
    fontSize: 14,
    color: "#1565C0",
    textAlign: "center",
    lineHeight: 20,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: "80%",
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
  chatBubbleText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },
  userBubbleText: {
    color: "#fff",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  chatInputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingBottom: 32,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  chatSendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
  },
  chatSendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  chatSendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
