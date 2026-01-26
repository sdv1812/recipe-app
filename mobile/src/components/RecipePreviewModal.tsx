import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";
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
            <Ionicons name="close" size={28} color={Colors.text.secondary} />
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
                <Ionicons
                  name="restaurant-outline"
                  size={16}
                  color={Colors.text.secondary}
                  style={styles.metaIcon}
                />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
            )}
            {recipe.prepTimeMinutes && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={Colors.text.secondary}
                  style={styles.metaIcon}
                />
                <Text style={styles.metaText}>
                  {recipe.prepTimeMinutes} min prep
                </Text>
              </View>
            )}
            {recipe.cookTimeMinutes && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="flame-outline"
                  size={16}
                  color={Colors.text.secondary}
                  style={styles.metaIcon}
                />
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
            <Ionicons
              name="close"
              size={18}
              color={Colors.error}
              style={{ marginRight: Spacing.xs }}
            />
            <Text style={styles.discardButtonText} numberOfLines={1}>
              Ask for Changes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => onSave(recipe)}
          >
            <Ionicons
              name="checkmark"
              size={18}
              color={Colors.card}
              style={{ marginRight: Spacing.xs }}
            />
            <Text style={styles.saveButtonText} numberOfLines={1}>
              Save Recipe
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.base,
    paddingTop: 60,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography.size["3xl"],
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.base,
    marginBottom: Spacing.lg,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    marginRight: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  chipsContainer: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipText: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.medium,
  },
  tagChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipText: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.medium,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  ingredientItem: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  bullet: {
    fontSize: Typography.size.base,
    color: Colors.primary,
    marginRight: Spacing.sm,
    fontWeight: Typography.weight.bold,
  },
  ingredientText: {
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    flex: 1,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: Spacing.base,
  },
  stepNumber: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    marginRight: Spacing.sm,
    minWidth: 24,
  },
  stepText: {
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
  },
  footer: {
    flexDirection: "row",
    padding: Spacing.base,
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Spacing["2xl"],
  },
  discardButton: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  discardButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.error,
    flexShrink: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.card,
    flexShrink: 1,
  },
});
