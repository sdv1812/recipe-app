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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Recipe JSON</Text>
        <View style={{ width: 40 }} />
      </View>

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
                <Text style={styles.clearIcon}>✕</Text>
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
              <>
                <Text style={styles.importIcon}>✅</Text>
                <Text style={styles.importButtonText}>Import Recipe</Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: "#007AFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
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
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
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
  importButton: {
    backgroundColor: "#4CAF50",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  importButtonDisabled: {
    backgroundColor: "#ccc",
  },
  importIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  importButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  exampleContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
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
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
  },
});
