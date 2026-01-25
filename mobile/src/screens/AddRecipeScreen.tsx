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
import * as Clipboard from "expo-clipboard";
import { RootStackParamList } from "../navigation/types";
import { parseRecipeJson, validateRecipeJson } from "../utils/recipeParser";
import { RecipeImport } from "../../../shared/types";
import { CHATGPT_PROMPT } from "../constants/prompts";
import { api } from "../utils/api";

type AddRecipeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

export default function AddRecipeScreen() {
  const navigation = useNavigation<AddRecipeScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"ai" | "paste">("ai");
  const [jsonText, setJsonText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

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
          onPress: () =>
            navigation.navigate("MainTabs", { screen: "MyRecipes" }),
        },
      ]);
      setJsonText("");
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

  const handleCopyPrompt = async () => {
    await Clipboard.setStringAsync(CHATGPT_PROMPT);
    Alert.alert("Copied!", "ChatGPT prompt copied to clipboard");
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert(
        "Empty Prompt",
        "Please describe the recipe you want to generate",
      );
      return;
    }

    try {
      setLoading(true);

      // Call AI generation API
      const generatedRecipe = await api.generateRecipe(aiPrompt.trim());

      // Parse for display
      const recipe = parseRecipeJson(generatedRecipe);

      // Save the generated recipe to the database
      await api.createRecipe(generatedRecipe);

      Alert.alert("Success", `"${recipe.title}" generated successfully!`, [
        {
          text: "OK",
          onPress: () => {
            setAiPrompt("");
            navigation.navigate("MainTabs", { screen: "MyRecipes" });
          },
        },
      ]);
    } catch (error) {
      console.error("Error generating recipe:", error);
      Alert.alert(
        "Generation Failed",
        error instanceof Error
          ? error.message
          : "Failed to generate recipe. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Chef</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Mode Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, mode === "ai" && styles.activeTab]}
            onPress={() => setMode("ai")}
          >
            <Text
              style={[styles.tabText, mode === "ai" && styles.activeTabText]}
            >
              🤖 Generate with AI
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === "paste" && styles.activeTab]}
            onPress={() => setMode("paste")}
          >
            <Text
              style={[styles.tabText, mode === "paste" && styles.activeTabText]}
            >
              📝 Paste JSON
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "ai" ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modeContent}
          >
            <Text style={styles.instructionText}>
              Describe the recipe you'd like to create, and AI will generate it
              for you.
            </Text>

            <Text style={styles.exampleLabel}>Examples:</Text>
            <View style={styles.examplesContainer}>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() =>
                  setAiPrompt("healthy chicken salad with avocado")
                }
              >
                <Text style={styles.exampleText}>🥗 Healthy chicken salad</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() => setAiPrompt("quick 15-minute pasta carbonara")}
              >
                <Text style={styles.exampleText}>🍝 Quick pasta carbonara</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() => setAiPrompt("vegan chocolate chip cookies")}
              >
                <Text style={styles.exampleText}>🍪 Vegan cookies</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.promptInput}
                multiline
                placeholder="E.g., spicy Thai basil chicken stir-fry with vegetables..."
                value={aiPrompt}
                onChangeText={setAiPrompt}
                textAlignVertical="top"
              />
              {aiPrompt.trim() && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setAiPrompt("")}
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleGenerateWithAI}
              disabled={loading || !aiPrompt.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>✨ Generate Recipe</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.noteText}>
              💡 Tip: Be specific! Include cuisine type, dietary restrictions,
              cooking time, or specific ingredients.
            </Text>
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.modeContent}>
            <Text style={styles.instructionText}>
              Paste the JSON recipe from ChatGPT below.
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
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePasteJson}
              disabled={loading || !jsonText.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.uploadIcon}>✅</Text>
                  <Text style={styles.uploadButtonText}>Import Recipe</Text>
                </>
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
          </View>
        )}
      </ScrollView>
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
    justifyContent: "flex-start",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  copyPromptButton: {
    backgroundColor: "#2196F3",
    padding: 16,
    margin: 20,
    marginBottom: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  copyPromptIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  copyPromptText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#4CAF50",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },
  modeContent: {
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    lineHeight: 22,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  jsonInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    paddingRight: 48,
    fontSize: 14,
    fontFamily: "monospace",
    minHeight: 200,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  clearButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#e0e0e0",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  clearIcon: {
    color: "#666",
    fontSize: 14,
    fontWeight: "bold",
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  exampleContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  exampleBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  exampleCode: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
  },
  promptInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    paddingRight: 48,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  examplesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    gap: 8,
  },
  exampleChip: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  exampleText: {
    fontSize: 14,
    color: "#666",
  },
  noteText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    marginTop: 16,
    lineHeight: 20,
  },
});
