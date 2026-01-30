import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Recipe, Thread } from "../../../shared/types";
import { formatTime } from "../utils/timeFormatter";
import {
  useRecipes,
  useDeleteRecipe,
  useThreads,
  useDeleteThread,
} from "../utils/queries";
import Tag from "../components/Tag";
import Loader from "../components/Loader";
import Header from "../components/Header";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Components,
} from "../constants/design";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

type ViewMode = "recipes" | "drafts" | "favorites";

export default function HomeScreen() {
  const navigation = useNavigation<any>(); // Using any to access tab navigation
  const [viewMode, setViewMode] = useState<ViewMode>("recipes");
  const [searchQuery, setSearchQuery] = useState("");

  // Use React Query hooks
  const { data: recipes = [], isLoading, isFetching, refetch } = useRecipes();
  const {
    data: threads = [],
    isLoading: threadsLoading,
    refetch: refetchThreads,
  } = useThreads();
  const deleteMutation = useDeleteRecipe();
  const deleteThreadMutation = useDeleteThread();

  const handleDeleteRecipe = (recipeId: string) => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(recipeId);
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to delete recipe",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteDraft = (threadId: string) => {
    Alert.alert("Delete Draft", "Are you sure you want to delete this draft?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteThreadMutation.mutateAsync(threadId);
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "Failed to delete draft",
            );
          }
        },
      },
    ]);
  };

  const handleClearAllRecipes = () => {
    Alert.alert(
      "Clear All Recipes",
      "This will delete ALL your recipes. This cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete all recipes via mutation
              await Promise.all(
                recipes.map((recipe) => deleteMutation.mutateAsync(recipe.id)),
              );
              Alert.alert("Success", "All recipes cleared");
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to clear recipes",
              );
            }
          },
        },
      ],
    );
  };

  const filterRecipes = () => {
    let filtered = recipes;

    // Filter by favorites if in favorites mode
    if (viewMode === "favorites") {
      filtered = filtered.filter((r) => r.isFavorite);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((recipe) => {
        // Search in title
        if (recipe.title.toLowerCase().includes(query)) return true;

        // Search in ingredients
        if (
          recipe.ingredients.some((ing) =>
            ing.name.toLowerCase().includes(query),
          )
        )
          return true;

        // Search in tags
        if (recipe.tags.some((tag) => tag.toLowerCase().includes(query)))
          return true;

        // Search in categories
        if (recipe.category.some((cat) => cat.toLowerCase().includes(query)))
          return true;

        return false;
      });
    }

    return filtered;
  };

  const getDrafts = () => {
    return threads.filter((thread) => thread.status === "draft");
  };

  const handleOpenNewChat = () => {
    navigation.navigate("ChatModal", { mode: "new" });
  };

  const handleOpenDraft = (threadId: string) => {
    navigation.navigate("ChatModal", { threadId, mode: "existing" });
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => {
    const getTotalTime = () => {
      const total =
        (item.prepTimeMinutes || 0) +
        (item.marinateTimeMinutes || 0) +
        (item.cookTimeMinutes || 0);
      return total > 0 ? formatTime(total) : null;
    };

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() =>
          navigation.navigate("RecipeDetail", { recipeId: item.id })
        }
        onLongPress={() => handleDeleteRecipe(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.isFavorite && (
              <Ionicons name="heart" size={16} color={Colors.primary} />
            )}
          </View>
          {item.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>

        <View style={styles.cardMeta}>
          {item.servings && (
            <View style={styles.metaItem}>
              <Ionicons
                name="restaurant-outline"
                size={14}
                color={Colors.text.secondary}
                style={styles.metaIcon}
              />
              <Text style={styles.metaText}>{item.servings}</Text>
            </View>
          )}
          {getTotalTime() && (
            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={Colors.text.secondary}
                style={styles.metaIcon}
              />
              <Text style={styles.metaText}>{getTotalTime()}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons
              name="nutrition-outline"
              size={14}
              color={Colors.text.secondary}
              style={styles.metaIcon}
            />
            <Text style={styles.metaText}>{item.ingredients.length}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons
              name="list-outline"
              size={14}
              color={Colors.text.secondary}
              style={styles.metaIcon}
            />
            <Text style={styles.metaText}>
              {item.preparationSteps.length + item.cookingSteps.length}
            </Text>
          </View>
        </View>

        {item.category.length > 0 && (
          <View style={styles.tagContainer}>
            {item.category.slice(0, 3).map((cat, index) => (
              <Tag key={index} text={cat} />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDraftCard = ({ item }: { item: Thread }) => {
    const messageCount = item.messages?.length || 0;
    const lastMessage = item.messages?.[messageCount - 1];
    const preview = lastMessage?.content.substring(0, 60) || "No messages yet";

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => handleOpenDraft(item.id)}
        onLongPress={() => handleDeleteDraft(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={styles.draftIconContainer}>
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={Colors.text.secondary}
              />
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title || "New chat"}
            </Text>
          </View>
          <Text style={styles.draftSubtitle}>
            Draft - No recipe created yet
          </Text>
          {messageCount > 0 && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {preview}
            </Text>
          )}
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={Colors.text.secondary}
              style={styles.metaIcon}
            />
            <Text style={styles.metaText}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons
              name="chatbubbles-outline"
              size={14}
              color={Colors.text.secondary}
              style={styles.metaIcon}
            />
            <Text style={styles.metaText}>{messageCount} messages</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Recipes"
        subtitle={
          viewMode === "recipes"
            ? recipes.length > 0
              ? `${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"}`
              : undefined
            : viewMode === "drafts"
              ? `${getDrafts().length} ${getDrafts().length === 1 ? "draft" : "drafts"}`
              : `${recipes.filter((r) => r.isFavorite).length} favorites`
        }
        rightActions={
          <View style={styles.headerActions}>
            {recipes.length > 0 && viewMode === "recipes" && (
              <TouchableOpacity
                onPress={handleClearAllRecipes}
                style={styles.clearAllButton}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            viewMode === "recipes" && styles.segmentButtonActive,
          ]}
          onPress={() => setViewMode("recipes")}
        >
          <Text
            style={[
              styles.segmentButtonText,
              viewMode === "recipes" && styles.segmentButtonTextActive,
            ]}
          >
            Recipes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            viewMode === "drafts" && styles.segmentButtonActive,
          ]}
          onPress={() => setViewMode("drafts")}
        >
          <Text
            style={[
              styles.segmentButtonText,
              viewMode === "drafts" && styles.segmentButtonTextActive,
            ]}
          >
            Drafts {getDrafts().length > 0 && `(${getDrafts().length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            viewMode === "favorites" && styles.segmentButtonActive,
          ]}
          onPress={() => setViewMode("favorites")}
        >
          <Text
            style={[
              styles.segmentButtonText,
              viewMode === "favorites" && styles.segmentButtonTextActive,
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {((viewMode === "recipes" && recipes.length > 0) ||
        viewMode === "favorites") && (
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={Colors.text.secondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              placeholderTextColor={Colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      {isLoading || threadsLoading ? (
        <Loader />
      ) : viewMode === "recipes" && recipes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No recipes yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the composer below to create your first recipe with AI
          </Text>
        </View>
      ) : viewMode === "drafts" && getDrafts().length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No drafts</Text>
          <Text style={styles.emptySubtitle}>
            Start a chat to create a draft
          </Text>
        </View>
      ) : viewMode === "favorites" &&
        recipes.filter((r) => r.isFavorite).length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No favorites</Text>
          <Text style={styles.emptySubtitle}>
            Mark recipes as favorites to see them here
          </Text>
        </View>
      ) : viewMode === "recipes" && filterRecipes().length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No matches</Text>
          <Text style={styles.emptySubtitle}>Try a different search term</Text>
        </View>
      ) : viewMode === "drafts" ? (
        <FlatList
          data={getDrafts()}
          renderItem={renderDraftCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => {
                refetch();
                refetchThreads();
              }}
              tintColor={Colors.primary}
            />
          }
        />
      ) : (
        <FlatList
          data={filterRecipes()}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
        />
      )}

      {/* Bottom Composer */}
      <View style={styles.composerContainer}>
        <TouchableOpacity
          style={styles.composer}
          onPress={handleOpenNewChat}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={Colors.text.secondary}
            style={styles.composerIcon}
          />
          <Text style={styles.composerPlaceholder}>
            Ask SousAI to create a recipe...
          </Text>
          <View style={styles.composerSendButton}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  clearAllButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "transparent",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    minHeight: 32,
    justifyContent: "center",
  },
  clearAllText: {
    fontSize: Typography.size.sm,
    color: Colors.error,
    fontWeight: Typography.weight.semibold,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.text.secondary,
  },
  filterButtonTextActive: {
    color: Colors.card,
  },
  searchWrapper: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  searchContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    padding: 0,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  clearButtonText: {
    fontSize: Typography.size.lg,
    color: Colors.text.secondary,
  },
  listContent: {
    padding: Spacing.base,
  },
  recipeCard: {
    ...Components.card,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    marginBottom: Spacing.sm,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: Typography.size.lg * Typography.lineHeight.tight,
  },
  favoriteDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
    marginTop: 6,
  },
  cardDescription: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    marginRight: Spacing.xs,
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
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    textAlign: "center",
    opacity: 0.7,
  },
  // Segmented Control
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.xs,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonActive: {
    backgroundColor: Colors.primary,
  },
  segmentButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.text.secondary,
  },
  segmentButtonTextActive: {
    color: Colors.card,
    fontWeight: Typography.weight.semibold,
  },
  // Draft Card Styles
  draftIconContainer: {
    marginRight: Spacing.xs,
    marginTop: 2,
  },
  draftSubtitle: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    fontStyle: "italic",
    marginBottom: Spacing.xs,
  },
  // Bottom Composer
  composerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    height: 48,
  },
  composerIcon: {
    marginRight: Spacing.sm,
  },
  composerPlaceholder: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
  },
  composerSendButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
});
