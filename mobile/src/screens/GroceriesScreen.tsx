import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";
import Loader from "../components/Loader";
import Header from "../components/Header";
import {
  useGroceries,
  useToggleGroceryItem,
  useClearCompletedGroceries,
  useDeleteGroceryItem,
  useAddToGroceries,
  useUpdateGroceryItem,
} from "../utils/queries";
import { GroceryItem } from "../../../shared/types";

export default function GroceriesScreen() {
  const { data: groceries = [], isLoading, refetch } = useGroceries();
  const toggleMutation = useToggleGroceryItem();
  const clearMutation = useClearCompletedGroceries();
  const deleteMutation = useDeleteGroceryItem();
  const addMutation = useAddToGroceries();
  const updateMutation = useUpdateGroceryItem();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnit, setItemUnit] = useState("");

  const pendingItems = groceries.filter((item) => !item.completed);
  const completedItems = groceries.filter((item) => item.completed);

  const handleToggle = (itemId: string) => {
    toggleMutation.mutate(itemId);
  };

  const handleDelete = (item: GroceryItem) => {
    Alert.alert(
      "Grocery Item",
      `What would you like to do with "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit",
          onPress: () => handleEdit(item),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(item.id),
        },
      ],
    );
  };

  const handleEdit = (item: GroceryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemQuantity(item.quantity || "");
    setItemUnit(item.unit || "");
    setShowAddModal(true);
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

  const handleAddItem = async () => {
    if (!itemName.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    try {
      if (editingItem) {
        // Update existing item
        await updateMutation.mutateAsync({
          itemId: editingItem.id,
          updates: {
            name: itemName.trim(),
            quantity: itemQuantity.trim() || undefined,
            unit: itemUnit.trim() || undefined,
          },
        });
      } else {
        // Add new item
        await addMutation.mutateAsync({
          items: [
            {
              name: itemName.trim(),
              quantity: itemQuantity.trim() || undefined,
              unit: itemUnit.trim() || undefined,
            },
          ],
        });
      }

      // Reset form and close modal
      setItemName("");
      setItemQuantity("");
      setItemUnit("");
      setEditingItem(null);
      setShowAddModal(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : editingItem
            ? "Failed to update item"
            : "Failed to add item",
      );
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setItemName("");
    setItemQuantity("");
    setItemUnit("");
  };

  const renderItem = ({ item }: { item: GroceryItem }) => (
    <TouchableOpacity
      style={styles.groceryItem}
      onPress={() => handleToggle(item.id)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.checkbox}>
        <Text style={styles.checkboxText}>{item.completed ? "✓" : ""}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, item.completed && styles.completedText]}>
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
    return <Loader text="Loading groceries..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Grocery List"
        rightActions={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
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
        }
      />

      {pendingItems.length === 0 && completedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your grocery list is empty</Text>
          <Text style={styles.emptySubtext}>
            Add items from recipe shopping lists or manually
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.listContainer}
        >
          {/* Pending Section */}
          {pendingItems.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Pending ({pendingItems.length})
                </Text>
              </View>
              {pendingItems.map((item) => (
                <View key={item.id}>{renderItem({ item })}</View>
              ))}
            </View>
          )}

          {/* Completed Section */}
          {completedItems.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Completed ({completedItems.length})
                </Text>
              </View>
              {completedItems.map((item) => (
                <View key={item.id}>{renderItem({ item })}</View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingItem ? "Edit Grocery Item" : "Add Grocery Item"}
                </Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Text style={styles.modalCloseButton}>Close</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Milk, Eggs, Bread"
                  value={itemName}
                  onChangeText={setItemName}
                  autoFocus
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2"
                    value={itemQuantity}
                    onChangeText={setItemQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <View
                  style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}
                >
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="lbs, kg, pcs"
                    value={itemUnit}
                    onChangeText={setItemUnit}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCloseModal}
                  disabled={addMutation.isPending || updateMutation.isPending}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    (addMutation.isPending || updateMutation.isPending) &&
                      styles.saveButtonDisabled,
                  ]}
                  onPress={handleAddItem}
                  disabled={addMutation.isPending || updateMutation.isPending}
                >
                  {addMutation.isPending || updateMutation.isPending ? (
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingItem ? "Update Item" : "Add Item"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    alignItems: "center",
    gap: Spacing.sm,
  },
  addButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    minHeight: 32,
    justifyContent: "center",
  },
  addButtonText: {
    color: Colors.card,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  clearButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "transparent",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    minHeight: 32,
    justifyContent: "center",
  },
  clearButtonText: {
    color: Colors.error,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  scrollContainer: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.md,
  },
  sectionHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groceryItem: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
    marginRight: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  itemQuantity: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: Colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  emptyText: {
    fontSize: Typography.size["2xl"],
    fontWeight: Typography.weight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    textAlign: "center",
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    paddingBottom: Spacing["3xl"],
  },
  modalContent: {
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.size["2xl"],
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
  },
  modalCloseButton: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.semibold,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.size.base,
    backgroundColor: Colors.background,
    color: Colors.text.primary,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.card,
  },
});
