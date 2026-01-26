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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Recipe, ChatMessage, RecipeImport } from "../../../shared/types";
import { api } from "../utils/api";
import { shareRecipe } from "../utils/recipeShare";
import RecipePreviewModal from "../components/RecipePreviewModal";
import ChatInterface from "../components/ChatInterface";
import { useRecipe, useUpdateRecipe } from "../utils/queries";

type RecipeDetailRouteProp = RouteProp<RootStackParamList, "RecipeDetail">;
type RecipeDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "RecipeDetail"
>;

interface ChatMessageWithRecipe {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  recipe?: RecipeImport;
}

const WELCOME_MESSAGE: ChatMessageWithRecipe = {
  id: "welcome",
  role: "assistant",
  content:
    "👋 Hi! I'm here to help you modify this recipe.\n\nYou can ask me to:\n• \"Make it less spicy\"\n• \"Add more vegetables\"\n• \"Make it vegan\"\n• \"Reduce cooking time\"\n\nTap the recipe card below to see the current version!",
  timestamp: new Date().toISOString(),
};

export default function RecipeDetailScreen() {
  const navigation = useNavigation<RecipeDetailNavigationProp>();
  const route = useRoute<RecipeDetailRouteProp>();
  const { recipeId } = route.params;

  // Use React Query hooks
  const { data: recipe, isLoading, refetch } = useRecipe(recipeId);
  const updateMutation = useUpdateRecipe();

  const [activeTab, setActiveTab] = useState<
    "ingredients" | "prep" | "cooking" | "shopping"
  >("ingredients");
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessageWithRecipe[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewRecipe, setPreviewRecipe] = useState<RecipeImport | null>(null);

  useEffect(() => {
    // Initialize chat history with welcome message and recipe
    if (recipe && chatHistory.length === 0) {
      const recipeAsImport = convertRecipeToImport(recipe);
      setChatHistory([
        {
          ...WELCOME_MESSAGE,
          recipe: recipeAsImport,
        },
      ]);
    }
  }, [recipe]);

  const convertRecipeToImport = (recipe: Recipe): RecipeImport => {
    return {
      title: recipe.title,
      description: recipe.description,
      servings: recipe.servings,
      prepTimeMinutes: recipe.prepTimeMinutes,
      marinateTimeMinutes: recipe.marinateTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      category: recipe.category,
      tags: recipe.tags,
      ingredients: recipe.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
      preparationSteps: recipe.preparationSteps.map((s) => s.instruction),
      cookingSteps: recipe.cookingSteps.map((s) => s.instruction),
    };
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
      await updateMutation.mutateAsync({
        recipeId: recipe.id,
        updates: { isFavorite: !recipe.isFavorite },
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Could not update favorite status",
      );
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !recipe || isChatting) return;

    const userMessage = chatMessage.trim();
    setChatMessage("");
    setIsChatting(true);

    const newUserMessage: ChatMessageWithRecipe = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prev) => [...prev, newUserMessage]);

    try {
      // Call API to update recipe
      const response = await api.chatWithRecipe(recipe.id, userMessage, []);

      const recipeAsImport = convertRecipeToImport(response.recipe);

      const aiMessage: ChatMessageWithRecipe = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I've suggested changes to your recipe! Tap the card below to preview and accept/discard the changes.",
        timestamp: new Date().toISOString(),
        recipe: recipeAsImport,
      };

      setChatHistory((prev) => [...prev, aiMessage]);

      // Check if a new preference was detected
      if (response.preferenceAdded) {
        Alert.alert(
          "✨ Preference Saved",
          `I noticed you prefer "${response.preferenceAdded}". I've saved this to your preferences so all future recipes will follow this!`,
          [
            {
              text: "View Preferences",
              onPress: () => navigation.navigate("Preferences"),
            },
            { text: "OK" },
          ],
        );
      }
    } catch (error) {
      const errorMessage: ChatMessageWithRecipe = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I had trouble updating the recipe. ${error instanceof Error ? error.message : "Please try again."}`,
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatting(false);
    }
  };

  const handlePreviewRecipe = (recipeData: RecipeImport) => {
    setPreviewRecipe(recipeData);
    setShowPreview(true);
  };

  const handleSaveRecipe = async (recipeData: RecipeImport) => {
    if (!recipe) return;

    try {
      // Convert RecipeImport back to Recipe format for update
      const updatedRecipe: Partial<Recipe> = {
        title: recipeData.title,
        description: recipeData.description,
        servings: recipeData.servings,
        prepTimeMinutes: recipeData.prepTimeMinutes,
        marinateTimeMinutes: recipeData.marinateTimeMinutes,
        cookTimeMinutes: recipeData.cookTimeMinutes,
        category: recipeData.category,
        tags: recipeData.tags,
        ingredients: recipeData.ingredients,
        preparationSteps: recipeData.preparationSteps.map((step, idx) => ({
          stepNumber: idx + 1,
          instruction: typeof step === "string" ? step : step.instruction,
          completed: recipe.preparationSteps[idx]?.completed || false,
        })),
        cookingSteps: recipeData.cookingSteps.map((step, idx) => ({
          stepNumber: idx + 1,
          instruction: typeof step === "string" ? step : step.instruction,
          completed: recipe.cookingSteps[idx]?.completed || false,
          duration: recipe.cookingSteps[idx]?.duration,
        })),
      };

      await updateMutation.mutateAsync({
        recipeId: recipe.id,
        updates: updatedRecipe,
      });

      setShowPreview(false);
      setPreviewRecipe(null);

      Alert.alert(
        "Recipe Updated!",
        `"${recipeData.title}" has been updated successfully.`,
        [{ text: "OK" }],
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to update recipe. Please try again.",
      );
    }
  };

  const handleDiscardRecipe = () => {
    setShowPreview(false);
    setPreviewRecipe(null);
  };

  const toggleStepCompletion = (
    type: "prep" | "cooking",
    stepNumber: number,
  ) => {
    if (!recipe) return;

    const steps =
      type === "prep" ? recipe.preparationSteps : recipe.cookingSteps;
    const updatedSteps = steps.map((step) =>
      step.stepNumber === stepNumber
        ? { ...step, completed: !step.completed }
        : step,
    );

    const updatedRecipe = {
      ...recipe,
      [type === "prep" ? "preparationSteps" : "cookingSteps"]: updatedSteps,
    };

    // Optimistically update using the mutation
    updateMutation.mutate({
      recipeId: recipe.id,
      updates: {
        [type === "prep" ? "preparationSteps" : "cookingSteps"]: updatedSteps,
      },
    });
  };

  const toggleShoppingItem = (itemId: string) => {
    if (!recipe) return;

    const updatedItems = recipe.shoppingList.map((item) =>
      item.id === itemId ? { ...item, purchased: !item.purchased } : item,
    );

    // Optimistically update using the mutation
    updateMutation.mutate({
      recipeId: recipe.id,
      updates: {
        shoppingList: updatedItems,
      },
    });
  };

  const formatTimeBreakdown = () => {
    if (!recipe) return "";
    const parts = [];
    if (recipe.prepTimeMinutes)
      parts.push(`Prep: ${recipe.prepTimeMinutes}m`);
    if (recipe.marinateTimeMinutes)
      parts.push(`Marinate: ${recipe.marinateTimeMinutes}m`);
    if (recipe.cookTimeMinutes) parts.push(`Cook: ${recipe.cookTimeMinutes}m`);
    return parts.join(" • ");
  };

  const renderRecipeCard = (message: ChatMessageWithRecipe) => {
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
          <Text style={styles.recipeCardCTA}>Tap to preview →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
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

  const currentRecipe = convertRecipeToImport(recipe);

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
            style={styles.aiButton}
            onPress={() => setShowChatModal(true)}
          >
            <Text style={styles.aiButtonText}>🤖 AI</Text>
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
            <Text style={styles.shareButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          {recipe.description && (
            <Text style={styles.recipeDescription}>{recipe.description}</Text>
          )}

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🍽️</Text>
              <Text style={styles.metaText}>{recipe.servings} servings</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>{formatTimeBreakdown()}</Text>
            </View>
          </View>

          {recipe.category && recipe.category.length > 0 && (
            <View style={styles.categoryContainer}>
              {recipe.category.map((cat, index) => (
                <View key={index} style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{cat}</Text>
                </View>
              ))}
            </View>
          )}

          {recipe.tags && recipe.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {recipe.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag.trim()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "ingredients" && styles.activeTab]}
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
              Preparation
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
            <View style={styles.ingredientsContainer}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientBullet}>•</Text>
                  <Text style={styles.ingredientText}>
                    {ingredient.quantity} {ingredient.unit} {ingredient.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === "prep" && (
            <View style={styles.stepsContainer}>
              {recipe.preparationSteps.map((step) => (
                <TouchableOpacity
                  key={step.stepNumber}
                  style={styles.stepItem}
                  onPress={() => toggleStepCompletion("prep", step.stepNumber)}
                >
                  <View style={styles.stepCheckbox}>
                    <Text style={styles.stepCheckboxText}>
                      {step.completed ? "✓" : ""}
                    </Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepNumber}>Step {step.stepNumber}</Text>
                    <Text
                      style={[
                        styles.stepText,
                        step.completed && styles.completedStepText,
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
            <View style={styles.stepsContainer}>
              {recipe.cookingSteps.map((step) => (
                <TouchableOpacity
                  key={step.stepNumber}
                  style={styles.stepItem}
                  onPress={() =>
                    toggleStepCompletion("cooking", step.stepNumber)
                  }
                >
                  <View style={styles.stepCheckbox}>
                    <Text style={styles.stepCheckboxText}>
                      {step.completed ? "✓" : ""}
                    </Text>
                  </View>
                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <Text style={styles.stepNumber}>
                        Step {step.stepNumber}
                      </Text>
                      {step.duration && (
                        <Text style={styles.stepDuration}>
                          ⏱️ {step.duration}m
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepText,
                        step.completed && styles.completedStepText,
                      ]}
                    >
                      {step.instruction}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === "shopping" && (
            <View style={styles.shoppingContainer}>
              {recipe.shoppingList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.shoppingItem}
                  onPress={() => toggleShoppingItem(item.id)}
                >
                  <View style={styles.stepCheckbox}>
                    <Text style={styles.stepCheckboxText}>
                      {item.purchased ? "✓" : ""}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.shoppingText,
                      item.purchased && styles.purchasedText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowChatModal(false)}
            >
              <Text style={styles.modalCloseText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <ChatInterface
            chatHistory={chatHistory}
            userMessage={chatMessage}
            isGenerating={isChatting}
            placeholder="Ask AI to modify your recipe..."
            headerTitle={`🤖 Edit: ${recipe.title}`}
            headerSubtitle="Ask AI to modify your recipe"
            onMessageChange={setChatMessage}
            onSendMessage={handleSendMessage}
            renderMessageExtras={renderRecipeCard}
          />

          {showPreview && previewRecipe && (
            <RecipePreviewModal
              recipe={previewRecipe}
              visible={showPreview}
              onSave={handleSaveRecipe}
              onDiscard={handleDiscardRecipe}
            />
          )}
        </View>
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
  aiButton: {
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  aiButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
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
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  recipeHeader: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaIcon: {
    fontSize: 18,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: "#666",
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
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#4CAF50",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  tabContent: {
    backgroundColor: "#fff",
    minHeight: 400,
  },
  ingredientsContainer: {
    padding: 20,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  ingredientBullet: {
    fontSize: 16,
    color: "#4CAF50",
    marginRight: 12,
    marginTop: 2,
  },
  ingredientText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    lineHeight: 24,
  },
  stepsContainer: {
    padding: 20,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  stepCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCheckboxText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  stepNumber: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepDuration: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  stepText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  completedStepText: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  shoppingContainer: {
    padding: 20,
  },
  shoppingItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  shoppingText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  purchasedText: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    backgroundColor: "#fff",
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
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
