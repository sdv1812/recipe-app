import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Recipe, RecipeImport } from "../../../shared/types";
import { api } from "../utils/api";
import { shareRecipe } from "../utils/recipeShare";
import RecipePreviewModal from "../components/RecipePreviewModal";
import ChatInterface from "../components/ChatInterface";
import Tag from "../components/Tag";
import Loader from "../components/Loader";
import Header from "../components/Header";
import {
  useRecipe,
  useUpdateRecipe,
  useAddToGroceries,
} from "../utils/queries";

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
    'Hi! I\'m here to help you modify this recipe.\n\nYou can ask me to:\n• "Make it less spicy"\n• "Add more vegetables"\n• "Make it vegan"\n• "Reduce cooking time"\n\nTap the recipe card below to see the current version!',
  timestamp: new Date().toISOString(),
};

export default function RecipeDetailScreen() {
  const navigation = useNavigation<RecipeDetailNavigationProp>();
  const route = useRoute<RecipeDetailRouteProp>();
  const { recipeId } = route.params;

  // Use React Query hooks
  const { data: recipe, isLoading, refetch } = useRecipe(recipeId);
  const updateMutation = useUpdateRecipe();
  const addToGroceriesMutation = useAddToGroceries();

  const [activeTab, setActiveTab] = useState<
    "ingredients" | "prep" | "cooking" | "shopping"
  >("ingredients");
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessageWithRecipe[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewRecipe, setPreviewRecipe] = useState<RecipeImport | null>(null);
  const [selectedShoppingItems, setSelectedShoppingItems] = useState<
    Set<string>
  >(new Set());

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
        content:
          "I've suggested changes to your recipe! Tap the card below to preview and accept/discard the changes.",
        timestamp: new Date().toISOString(),
        recipe: recipeAsImport,
      };

      setChatHistory((prev) => [...prev, aiMessage]);

      // Check if a new preference was detected
      if (response.preferenceAdded) {
        Alert.alert(
          "Preference Saved",
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

  const formatTimeBreakdown = () => {
    if (!recipe) return "";
    const parts = [];
    if (recipe.prepTimeMinutes) parts.push(`Prep: ${recipe.prepTimeMinutes}m`);
    if (recipe.marinateTimeMinutes)
      parts.push(`Marinate: ${recipe.marinateTimeMinutes}m`);
    if (recipe.cookTimeMinutes) parts.push(`Cook: ${recipe.cookTimeMinutes}m`);
    return parts.join(" • ");
  };

  const toggleSelectShoppingItem = (itemId: string) => {
    setSelectedShoppingItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllShoppingItems = () => {
    if (!recipe) return;
    const allIds = new Set(recipe.shoppingList.map((item) => item.id));
    setSelectedShoppingItems(allIds);
  };

  const deselectAllShoppingItems = () => {
    setSelectedShoppingItems(new Set());
  };

  const handleAddToGroceries = async () => {
    if (!recipe || selectedShoppingItems.size === 0) return;

    const itemsToAdd = recipe.shoppingList
      .filter((item) => selectedShoppingItems.has(item.id))
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      }));

    try {
      await addToGroceriesMutation.mutateAsync({
        items: itemsToAdd,
        recipeId: recipe.id,
      });

      Alert.alert(
        "Added to Groceries!",
        `${itemsToAdd.length} item(s) added to your grocery list.`,
        [{ text: "OK" }],
      );

      // Clear selection
      setSelectedShoppingItems(new Set());
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to add items to groceries",
      );
    }
  };

  const renderRecipeCard = (message: ChatMessageWithRecipe) => {
    if (!message.recipe) return null;

    const totalTime =
      (message.recipe.prepTimeMinutes || 0) +
      (message.recipe.cookTimeMinutes || 0);

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => handlePreviewRecipe(message.recipe!)}
      >
        <Text style={styles.recipeCardTitle}>{message.recipe.title}</Text>

        {message.recipe.description && (
          <Text style={styles.recipeCardDescription} numberOfLines={2}>
            {message.recipe.description}
          </Text>
        )}

        <View style={styles.recipeCardMeta}>
          {message.recipe.servings && (
            <Text style={styles.recipeCardMetaItem}>
              {message.recipe.servings} servings
            </Text>
          )}
          {totalTime > 0 && <Text style={styles.recipeCardMetaItem}>•</Text>}
          {totalTime > 0 && (
            <Text style={styles.recipeCardMetaItem}>{totalTime} min</Text>
          )}
        </View>

        <Text style={styles.recipeCardCTA}>Tap to review</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <Loader text="Loading recipe..." />;
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
      <Header
        showBack={true}
        rightActions={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => setShowChatModal(true)}
            >
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.aiButtonText}>Edit with AI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={recipe.isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={
                  recipe.isFavorite ? Colors.primary : Colors.text.secondary
                }
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.content}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          {recipe.description && (
            <Text style={styles.recipeDescription}>{recipe.description}</Text>
          )}

          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>{recipe.servings} servings</Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.metaText}>{formatTimeBreakdown()}</Text>
          </View>

          {recipe.category && recipe.category.length > 0 && (
            <View style={styles.categoryContainer}>
              {recipe.category.map((cat, index) => (
                <Tag key={index} text={cat} />
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
                    <Text style={styles.stepNumber}>
                      Step {step.stepNumber}
                    </Text>
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
                          {step.duration}m
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
            <>
              <View style={styles.shoppingHeader}>
                <View style={styles.selectionControls}>
                  {selectedShoppingItems.size === recipe.shoppingList.length ? (
                    <TouchableOpacity onPress={deselectAllShoppingItems}>
                      <Text style={styles.selectionButton}>Deselect All</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={selectAllShoppingItems}>
                      <Text style={styles.selectionButton}>Select All</Text>
                    </TouchableOpacity>
                  )}
                  {selectedShoppingItems.size > 0 && (
                    <Text style={styles.selectedCount}>
                      {selectedShoppingItems.size} selected
                    </Text>
                  )}
                </View>
                {selectedShoppingItems.size > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.addToGroceriesButton,
                      addToGroceriesMutation.isPending &&
                        styles.addToGroceriesButtonDisabled,
                    ]}
                    onPress={handleAddToGroceries}
                    disabled={addToGroceriesMutation.isPending}
                  >
                    {addToGroceriesMutation.isPending ? (
                      <>
                        <ActivityIndicator
                          size="small"
                          color={Colors.card}
                          style={styles.buttonLoader}
                        />
                        <Text style={styles.addToGroceriesButtonText}>
                          Adding...
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.addToGroceriesButtonText}>
                        Add to Groceries
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.shoppingContainer}>
                {recipe.shoppingList.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.shoppingItemWrapper}
                    onPress={() => toggleSelectShoppingItem(item.id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selectedShoppingItems.has(item.id) &&
                          styles.checkboxSelected,
                      ]}
                    >
                      {selectedShoppingItems.has(item.id) && (
                        <Text style={styles.checkboxText}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.shoppingText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            title={`Edit: ${recipe.title}`}
            subtitle="Ask AI to modify your recipe"
            showClose={true}
            onClose={() => setShowChatModal(false)}
          />

          <ChatInterface
            chatHistory={chatHistory}
            userMessage={chatMessage}
            isGenerating={isChatting}
            placeholder="Ask AI to modify your recipe..."
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
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  aiButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: "transparent",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  aiButtonText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  favoriteIcon: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  favoriteIconActive: {
    backgroundColor: Colors.primary,
  },
  shareButtonText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
  content: {
    flex: 1,
  },
  recipeHeader: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recipeTitle: {
    fontSize: Typography.size["3xl"],
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  recipeDescription: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metaText: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  metaSeparator: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tag: {
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.medium,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.medium,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
  tabContent: {
    backgroundColor: Colors.card,
    minHeight: 400,
  },
  ingredientsContainer: {
    padding: Spacing.lg,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  ingredientBullet: {
    fontSize: Typography.size.base,
    color: Colors.primary,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  ingredientText: {
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 24,
  },
  stepsContainer: {
    padding: Spacing.lg,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepCheckbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCheckboxText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  stepNumber: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepDuration: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.medium,
  },
  stepText: {
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  completedStepText: {
    textDecorationLine: "line-through",
    color: Colors.text.secondary,
  },
  shoppingContainer: {
    padding: Spacing.lg,
  },
  shoppingHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.card,
  },
  selectionControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  selectionButton: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
  selectedCount: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  addToGroceriesButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing.sm,
    flexDirection: "row",
    justifyContent: "center",
  },
  addToGroceriesButtonDisabled: {
    opacity: 0.6,
  },
  buttonLoader: {
    marginRight: Spacing.sm,
  },
  addToGroceriesButtonText: {
    fontSize: Typography.size.base,
    color: Colors.card,
    fontWeight: Typography.weight.semibold,
  },
  shoppingItemWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
  },
  checkboxText: {
    fontSize: Typography.size.xs,
    color: Colors.card,
    fontWeight: Typography.weight.bold,
  },
  shoppingText: {
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    flex: 1,
  },
  purchasedText: {
    textDecorationLine: "line-through",
    color: Colors.text.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  recipeCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  recipeCardTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  recipeCardDescription: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  recipeCardMeta: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: "center",
  },
  recipeCardMetaItem: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
  },
  recipeCardCTA: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    textAlign: "center",
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
