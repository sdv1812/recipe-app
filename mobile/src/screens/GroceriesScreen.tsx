import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  useGroceries,
  useToggleGroceryItem,
  useClearCompletedGroceries,
  useDeleteGroceryItem,
} from "../utils/queries";
import { GroceryItem } from "../../../shared/types";

export default function GroceriesScreen() {
  const { data: groceries = [], isLoading, refetch } = useGroceries();
  const toggleMutation = useToggleGroceryItem();
  const clearMutation = useClearCompletedGroceries();
  const deleteMutation = useDeleteGroceryItem();

  const pendingItems = groceries.filter((item) => !item.completed);
  const completedItems = groceries.filter((item) => item.completed);

  const handleToggle = (itemId: string) => {
    toggleMutation.mutate(itemId);
  };

  const handleDelete = (itemId: string, itemName: string) => {
    Alert.alert("Delete Item", `Remove "${itemName}" from groceries?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(itemId),
      },
    ]);
  };

  const handleClearCompleted = () => {
    if (completedItems.length === 0) return;

    Alert.alert(
      "Clear Completed Items",
      `Remove all ${completedItems.length} completed items?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => clearMutation.mutate(),
        },
      ],
    );
  };

  const renderItem = ({
    item,
    completed,
  }: {
    item: GroceryItem;
    completed: boolean;
  }) => (
    <TouchableOpacity
      style={styles.groceryItem}
      onPress={() => handleToggle(item.id)}
      onLongPress={() => handleDelete(item.id, item.name)}
    >
      <View style={styles.checkbox}>
        <Text style={styles.checkboxText}>{completed ? "✓" : ""}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, completed && styles.completedText]}>
          {item.name}
        </Text>
        {item.quantity && (
          <Text style={styles.itemQuantity}>
            {item.quantity} {item.unit || ""}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading groceries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grocery List</Text>
        {completedItems.length > 0 && (
          <TouchableOpacity
            onPress={handleClearCompleted}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>
              Clear Done ({completedItems.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {pendingItems.length === 0 && completedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your grocery list is empty</Text>
          <Text style={styles.emptySubtext}>
            Add items from recipe shopping lists
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...pendingItems, ...completedItems]}
          renderItem={({ item }) =>
            renderItem({ item, completed: item.completed })
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            pendingItems.length > 0 && completedItems.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Pending ({pendingItems.length})
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            completedItems.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Completed ({completedItems.length})
                  </Text>
                </View>
              </>
            ) : null
          }
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groceryItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
    backgroundColor: "#fff",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: "#999",
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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
});
