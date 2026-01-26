import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { RecipeImport } from "../../../shared/types";

type RecipePreviewModalProps = {
  recipe: RecipeImport;
  visible: boolean;
  onSave: (recipe: RecipeImport) => void;
  onDiscard: () => void;
};

export default function RecipePreviewModal({
  recipe,
  visible,
  onSave,
  onDiscard,
}: RecipePreviewModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDiscard}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onDiscard} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Preview</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Recipe Content */}
        <ScrollView style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>

          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            {recipe.servings && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>🍽️</Text>
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
            )}
            {recipe.prepTimeMinutes && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>⏱️</Text>
                <Text style={styles.metaText}>
                  {recipe.prepTimeMinutes} min prep
                </Text>
              </View>
            )}
            {recipe.cookTimeMinutes && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>🔥</Text>
                <Text style={styles.metaText}>
                  {recipe.cookTimeMinutes} min cook
                </Text>
              </View>
            )}
          </View>

          {/* Categories & Tags */}
          {recipe.category && recipe.category.length > 0 && (
            <View style={styles.chipsContainer}>
              <Text style={styles.sectionLabel}>Categories:</Text>
              <View style={styles.chipsWrapper}>
                {recipe.category.map((cat, index) => (
                  <View key={index} style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {recipe.tags && recipe.tags.length > 0 && (
            <View style={styles.chipsContainer}>
              <Text style={styles.sectionLabel}>Tags:</Text>
              <View style={styles.chipsWrapper}>
                {recipe.tags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.ingredientText}>
                  {ingredient.quantity} {ingredient.unit} {ingredient.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Preparation Steps */}
          {recipe.preparationSteps && recipe.preparationSteps.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preparation</Text>
              {recipe.preparationSteps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <Text style={styles.stepNumber}>{index + 1}.</Text>
                  <Text style={styles.stepText}>
                    {typeof step === "string" ? step : step.instruction}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Cooking Steps */}
          {recipe.cookingSteps && recipe.cookingSteps.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cooking</Text>
              {recipe.cookingSteps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <Text style={styles.stepNumber}>{index + 1}.</Text>
                  <Text style={styles.stepText}>
                    {typeof step === "string" ? step : step.instruction}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.discardButton} onPress={onDiscard}>
            <Text style={styles.discardButtonText}>
              ✕ Discard & Ask for Changes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => onSave(recipe)}
          >
            <Text style={styles.saveButtonText}>✓ Save to My Recipes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: "#666",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    lineHeight: 22,
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
  },
  chipsContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  ingredientItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: "#007AFF",
    marginRight: 8,
    fontWeight: "bold",
  },
  ingredientText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#007AFF",
    marginRight: 8,
    minWidth: 24,
  },
  stepText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingBottom: 32,
  },
  discardButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF3B30",
    alignItems: "center",
  },
  discardButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF3B30",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
