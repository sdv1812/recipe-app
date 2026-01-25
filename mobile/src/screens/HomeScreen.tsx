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
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Recipe } from "../types/recipe";
import { api } from "../utils/api";
import { formatTime } from "../utils/timeFormatter";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

type HomeScreenProps = {
  onLogout?: () => void;
};

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const navigation = useNavigation<any>(); // Using any to access tab navigation
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadRecipes = async () => {
    try {
      const loadedRecipes = await api.getAllRecipes();
      setRecipes(loadedRecipes);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load recipes",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRecipes();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  };

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
              await api.deleteRecipe(recipeId);
              await loadRecipes();
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
              // Delete all recipes via API
              await Promise.all(
                recipes.map((recipe) => api.deleteRecipe(recipe.id)),
              );
              await loadRecipes();
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
      const times: string[] = [];
      if (item.prepTimeMinutes)
        times.push(`Prep: ${formatTime(item.prepTimeMinutes)}`);
      if (item.marinateTimeMinutes)
        times.push(`Marinate: ${formatTime(item.marinateTimeMinutes)}`);
      if (item.cookTimeMinutes)
        times.push(`Cook: ${formatTime(item.cookTimeMinutes)}`);
      return times.join(" | ");
    };

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() =>
          navigation.navigate("RecipeDetail", { recipeId: item.id })
        }
        onLongPress={() => handleDeleteRecipe(item.id)}
      >
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
          {item.isFavorite && <Text style={styles.favoriteIndicator}>❤️</Text>}
        </View>
        {getTotalTime() && (
          <Text style={styles.recipeTime}>⏱️ {getTotalTime()}</Text>
        )}
        {item.description && (
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.category.length > 0 && (
          <View style={styles.categoryContainer}>
            {item.category.slice(0, 3).map((cat, index) => (
              <View key={index} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.recipeFooter}>
          <Text style={styles.recipeInfo}>
            🍽️ {item.ingredients.length} ingredients
          </Text>
          <Text style={styles.recipeInfo}>
            📝 {item.preparationSteps.length + item.cookingSteps.length} steps
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>My Recipes</Text>
          {recipes.length > 0 && (
            <TouchableOpacity onPress={handleClearAllRecipes}>
              <Text style={styles.clearButton}>🗑️ Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerRight}>
          {onLogout && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert("Logout", "Are you sure you want to logout?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Logout", style: "destructive", onPress: onLogout },
                ]);
              }}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.filterButton,
              showFavoritesOnly && styles.filterButtonActive,
            ]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Text style={styles.filterButtonText}>
              {showFavoritesOnly ? "❤️" : "🤍"} Favorites
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {recipes.length > 0 && (
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ingredient, tag, or category..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading recipes...</Text>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recipes yet</Text>
          <Text style={styles.emptySubtext}>
            Tap "AI Chef" tab to create your first recipe
          </Text>
        </View>
      ) : filterRecipes().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? "No recipes found" : "No favorite recipes"}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? "Try a different search term"
              : "Tap the ❤️ icon on a recipe to mark it as favorite"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filterRecipes()}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AIChef")}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>🤖</Text>
        <Text style={styles.fabText}>AI</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  clearButton: {
    fontSize: 12,
    color: "#f44336",
    marginTop: 4,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterButton: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterButtonActive: {
    backgroundColor: "#FFE5E5",
    borderColor: "#FF6B6B",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FF3B30",
    marginRight: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  searchContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
  },
  clearSearchIcon: {
    fontSize: 18,
    color: "#999",
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  recipeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeHeader: {
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  favoriteIndicator: {
    fontSize: 16,
    marginLeft: 8,
  },
  recipeTime: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
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
  recipeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  recipeInfo: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#999",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#bbb",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "#007AFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
  fabText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    marginTop: -2,
  },
});
