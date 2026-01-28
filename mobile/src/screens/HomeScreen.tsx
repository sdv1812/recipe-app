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
import { Recipe } from "../../../shared/types";
import { formatTime } from "../utils/timeFormatter";
import { useRecipes, useDeleteRecipe } from "../utils/queries";
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

export default function HomeScreen() {
  const navigation = useNavigation<any>(); // Using any to access tab navigation
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Use React Query hooks
  const { data: recipes = [], isLoading, isFetching, refetch } = useRecipes();
  const deleteMutation = useDeleteRecipe();

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

    // Filter by favorites
    if (showFavoritesOnly) {
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

  return (
    <View style={styles.container}>
      <Header
        title="Recipes"
        subtitle={
          recipes.length > 0
            ? `${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"}`
            : undefined
        }
        rightActions={
          <View style={styles.headerActions}>
            {recipes.length > 0 && (
              <TouchableOpacity
                onPress={handleClearAllRecipes}
                style={styles.clearAllButton}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.filterButton,
                showFavoritesOnly && styles.filterButtonActive,
              ]}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  showFavoritesOnly && styles.filterButtonTextActive,
                ]}
              >
                Favorites
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {recipes.length > 0 && (
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

      {isLoading ? (
        <Loader />
      ) : recipes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No recipes yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the "AI Chef" tab to create your first recipe
          </Text>
        </View>
      ) : filterRecipes().length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>
            {searchQuery ? "No matches" : "No favorites"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? "Try a different search term"
              : "Mark recipes as favorites to see them here"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filterRecipes()}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
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
});
