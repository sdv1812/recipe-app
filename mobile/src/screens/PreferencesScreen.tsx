import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../utils/api";

export default function PreferencesScreen() {
  const navigation = useNavigation();
  const [preferences, setPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPreference, setNewPreference] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await api.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load preferences",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddPreference = async () => {
    if (!newPreference.trim()) {
      Alert.alert("Empty Input", "Please enter a preference");
      return;
    }

    try {
      setAdding(true);
      const updatedPrefs = await api.addPreference(newPreference.trim());
      setPreferences(updatedPrefs);
      setNewPreference("");
      Alert.alert("Success", "Preference added!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to add preference",
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemovePreference = (preference: string) => {
    Alert.alert("Remove Preference", `Remove "${preference}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const updatedPrefs = await api.removePreference(preference);
            setPreferences(updatedPrefs);
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error
                ? error.message
                : "Failed to remove preference",
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Preferences</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Set your food preferences here or simply tell the AI when chatting
            with recipes. AI will automatically remember your preferences!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Preference</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder='e.g., "no spicy food", "vegetarian", "quick meals"'
              value={newPreference}
              onChangeText={setNewPreference}
              editable={!adding}
            />
            <TouchableOpacity
              style={[styles.addButton, adding && styles.addButtonDisabled]}
              onPress={handleAddPreference}
              disabled={adding}
            >
              <Text style={styles.addButtonText}>
                {adding ? "Adding..." : "Add"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.examplesContainer}>
            <Text style={styles.examplesLabel}>Examples:</Text>
            {[
              "no spicy food",
              "vegetarian",
              "gluten-free",
              "low carb",
              "quick meals under 30 minutes",
            ].map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleChip}
                onPress={() => setNewPreference(example)}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your Preferences ({preferences.length})
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : preferences.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No preferences yet</Text>
              <Text style={styles.emptySubtext}>
                Add preferences above or chat with AI to set them automatically
              </Text>
            </View>
          ) : (
            <View style={styles.preferencesList}>
              {preferences.map((pref, index) => (
                <View key={index} style={styles.preferenceCard}>
                  <View style={styles.preferenceContent}>
                    <Text style={styles.preferenceIcon}>✓</Text>
                    <Text style={styles.preferenceText}>{pref}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemovePreference(pref)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1565C0",
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  examplesContainer: {
    marginTop: 16,
  },
  examplesLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  exampleChip: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  exampleText: {
    fontSize: 14,
    color: "#666",
  },
  preferencesList: {
    gap: 12,
  },
  preferenceCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  preferenceContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  preferenceIcon: {
    fontSize: 20,
    color: "#4CAF50",
    marginRight: 12,
  },
  preferenceText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 20,
    color: "#f44336",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#999",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#bbb",
    textAlign: "center",
  },
});
