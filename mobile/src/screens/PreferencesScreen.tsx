import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";
import { api } from "../utils/api";
import Loader from "../components/Loader";
import Header from "../components/Header";

export default function PreferencesScreen() {
  const navigation = useNavigation();
  const [preferences, setPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPreference, setNewPreference] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

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
      <Header title="My Preferences" showBack={true} />

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
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
            <Loader />
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
                  <Text style={styles.preferenceText}>{pref}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemovePreference(pref)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
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
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  infoCard: {
    backgroundColor: "#EFF6FF",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: Typography.size.sm,
    color: "#1E40AF",
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.size.base,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text.primary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: Colors.border,
  },
  addButtonText: {
    color: Colors.card,
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.base,
  },
  examplesContainer: {
    marginTop: Spacing.md,
  },
  examplesLabel: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  exampleChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exampleText: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  preferencesList: {
    gap: Spacing.md,
  },
  preferenceCard: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  preferenceText: {
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    flex: 1,
  },
  removeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  removeButtonText: {
    fontSize: Typography.size.sm,
    color: "#DC2626",
    fontWeight: Typography.weight.semibold,
  },
  loadingContainer: {
    padding: Spacing["3xl"],
    alignItems: "center",
  },
  emptyContainer: {
    padding: Spacing["3xl"],
    alignItems: "center",
  },
  emptyText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    textAlign: "center",
    opacity: 0.7,
  },
});
