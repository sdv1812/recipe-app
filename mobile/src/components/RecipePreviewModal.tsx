import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";
import { RecipeImport } from "../../../shared/types";
import { buildUnifiedStepsFromImport } from "../utils/recipeSteps";
import Header from "./Header";

type RecipePreviewModalProps = {
  recipe: RecipeImport;
  visible: boolean;
  onSave: (recipe: RecipeImport) => void;
  onDiscard: () => void;
  mode?: "draft" | "view";
  saveLabel?: string;
  discardLabel?: string;
  onUseThisRecipeInstead?: (recipe: RecipeImport) => void;
  isSaving?: boolean;
};

export default function RecipePreviewModal({
  recipe,
  visible,
  onSave,
  onDiscard,
  mode = "draft",
  saveLabel,
  discardLabel,
  onUseThisRecipeInstead,
  isSaving = false,
}: RecipePreviewModalProps) {
  const primaryLabel =
    saveLabel || (mode === "draft" ? "Save Recipe" : "Use This Recipe Instead");
  const secondaryLabel =
    discardLabel || (mode === "draft" ? "Ask for Changes" : "Close");

  const handlePrimary = () => {
    if (mode === "view") {
      onUseThisRecipeInstead?.(recipe);
      return;
    }

    onSave(recipe);
  };

  const showPrimary = mode === "draft" || Boolean(onUseThisRecipeInstead);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDiscard}
    >
      <View style={styles.container}>
        <Header title="Recipe Preview" showClose={true} onClose={onDiscard} />

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

          {/* Steps (unified) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Steps</Text>
            {buildUnifiedStepsFromImport(recipe).map((step) => (
              <View key={step.key} style={styles.stepItem}>
                <Text style={styles.stepNumber}>{step.order}.</Text>
                <View style={styles.stepContent}>
                  {step.tag && step.tag !== "neutral" && (
                    <View
                      style={[
                        styles.stepBadge,
                        step.tag === "prep"
                          ? styles.prepBadge
                          : styles.cookBadge,
                      ]}
                    >
                      <Text style={styles.stepBadgeText}>
                        {step.tag === "prep" ? "Prep" : "Cook"}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.stepText}>{step.instruction}</Text>
                  {step.duration && (
                    <Text style={styles.stepDuration}>⏱ {step.duration}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.discardButton}
            onPress={onDiscard}
            disabled={isSaving}
          >
            <Ionicons
              name="close"
              size={18}
              color={Colors.error}
              style={{ marginRight: Spacing.xs }}
            />
            <Text style={styles.discardButtonText} numberOfLines={1}>
              {secondaryLabel}
            </Text>
          </TouchableOpacity>

          {showPrimary && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handlePrimary}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.card} />
              ) : (
                <Ionicons
                  name={mode === "draft" ? "checkmark" : "swap-horizontal"}
                  size={18}
                  color={Colors.card}
                  style={{ marginRight: Spacing.xs }}
                />
              )}
              <Text style={styles.saveButtonText} numberOfLines={1}>
                {primaryLabel}
              </Text>
            </TouchableOpacity>
          )}
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
  stepContent: {
    flex: 1,
  },
  stepBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    alignSelf: "flex-start",
  },
  prepBadge: {
    backgroundColor: "#E0F2FE",
  },
  cookBadge: {
    backgroundColor: "#FEF3C7",
  },
  stepBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
  },
  stepText: {
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
  },
  stepDuration: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    fontStyle: "italic",
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
