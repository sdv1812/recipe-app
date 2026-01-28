import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { parseRecipeJson, validateRecipeJson } from "../utils/recipeParser";
import { RecipeImport } from "../../../shared/types";
import { api } from "../utils/api";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";
import Header from "../components/Header";

type ImportJsonScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ImportJson"
>;

export default function ImportJsonScreen() {
  const navigation = useNavigation<ImportJsonScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const handlePasteJson = async () => {
    if (!jsonText.trim()) {
      Alert.alert("Empty Input", "Please paste your recipe JSON first");
      return;
    }

    setLoading(true);
    try {
      const jsonData = JSON.parse(jsonText) as RecipeImport;

      // Validate JSON structure
      const validation = validateRecipeJson(jsonData);
      if (!validation.valid) {
        Alert.alert(
          "Invalid Recipe",
          validation.error || "The recipe format is invalid",
        );
        setLoading(false);
        return;
      }

      // Parse and save recipe
      const recipe = parseRecipeJson(jsonData);
      await api.createRecipe(jsonData);

      Alert.alert("Success", "Recipe imported successfully!", [
        {
          text: "OK",
          onPress: () => {
            setJsonText("");
            navigation.navigate("MainTabs", { screen: "MyRecipes" });
          },
        },
      ]);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      Alert.alert(
        "Invalid JSON",
        "Could not parse JSON. Please check the format and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Import Recipe JSON" showBack={true} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView style={styles.content}>
          <Text style={styles.instructionText}>
            Paste the JSON recipe from ChatGPT or any other source below.
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.jsonInput}
              multiline
              placeholder="Paste your recipe JSON here..."
              value={jsonText}
              onChangeText={setJsonText}
              textAlignVertical="top"
            />
            {jsonText.trim() && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setJsonText("")}
              >
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.importButton,
              (!jsonText.trim() || loading) && styles.importButtonDisabled,
            ]}
            onPress={handlePasteJson}
            disabled={loading || !jsonText.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.importButtonText}>Import Recipe</Text>
            )}
          </TouchableOpacity>

          <View style={styles.exampleContainer}>
            <Text style={styles.exampleTitle}>Expected JSON Format:</Text>
            <View style={styles.exampleBox}>
              <Text style={styles.exampleCode}>
                {`{
  "title": "Recipe Name",
  "description": "Optional description",
  "servings": 4,
  "prepTimeMinutes": 15,
  "marinateTimeMinutes": 0,
  "cookTimeMinutes": 30,
  "category": ["chicken", "indian"],
  "tags": ["spicy", "meal-prep"],
  "ingredients": [
    {
      "name": "Flour",
      "quantity": "2",
      "unit": "cups"
    }
  ],
  "preparationSteps": [
    "Mix ingredients",
    "Let rest for 10 minutes"
  ],
  "cookingSteps": [
    "Preheat oven to 350°F",
    "Bake for 20 minutes"
  ]
}`}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  instructionText: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  jsonInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    paddingRight: 72,
    fontSize: Typography.size.sm,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    minHeight: 200,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text.primary,
  },
  clearButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  clearText: {
    color: Colors.text.secondary,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  importButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  importButtonDisabled: {
    backgroundColor: Colors.border,
  },
  importButtonText: {
    color: Colors.card,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  exampleContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  exampleTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  exampleBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exampleCode: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: Typography.size.xs,
    color: Colors.text.primary,
    lineHeight: 18,
  },
});
