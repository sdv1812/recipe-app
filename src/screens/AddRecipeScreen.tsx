import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { RootStackParamList } from '../navigation/types';
import { storageUtils } from '../utils/storage';
import { parseRecipeJson, validateRecipeJson } from '../utils/recipeParser';
import { RecipeImport } from '../types/recipe';
import { CHATGPT_PROMPT } from '../constants/prompts';

type AddRecipeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddRecipe'>;

export default function AddRecipeScreen() {
  const navigation = useNavigation<AddRecipeScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'file' | 'paste'>('paste');
  const [jsonText, setJsonText] = useState('');

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setLoading(true);

      const file = result.assets[0];
      
      // Read file content
      const response = await fetch(file.uri);
      const jsonText = await response.text();
      const jsonData = JSON.parse(jsonText) as RecipeImport;

      // Validate JSON structure
      const validation = validateRecipeJson(jsonData);
      if (!validation.valid) {
        Alert.alert('Invalid Recipe', validation.error || 'The recipe format is invalid');
        setLoading(false);
        return;
      }

      // Parse and save recipe
      const recipe = parseRecipeJson(jsonData);
      await storageUtils.saveRecipe(recipe);

      Alert.alert('Success', 'Recipe imported successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } catch (error) {
      console.error('Error importing recipe:', error);
      Alert.alert(
        'Import Failed',
        'Could not import recipe. Please check the JSON format and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasteJson = async () => {
    if (!jsonText.trim()) {
      Alert.alert('Empty Input', 'Please paste your recipe JSON first');
      return;
    }

    setLoading(true);
    try {
      const jsonData = JSON.parse(jsonText) as RecipeImport;

      // Validate JSON structure
      const validation = validateRecipeJson(jsonData);
      if (!validation.valid) {
        Alert.alert('Invalid Recipe', validation.error || 'The recipe format is invalid');
        setLoading(false);
        return;
      }

      // Parse and save recipe
      const recipe = parseRecipeJson(jsonData);
      await storageUtils.saveRecipe(recipe);

      Alert.alert('Success', 'Recipe imported successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
      setJsonText('');
    } catch (error) {
      console.error('Error parsing JSON:', error);
      Alert.alert(
        'Invalid JSON',
        'Could not parse JSON. Please check the format and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    await Clipboard.setStringAsync(CHATGPT_PROMPT);
    Alert.alert('Copied!', 'ChatGPT prompt copied to clipboard');
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
        <Text style={styles.headerTitle}>Add Recipe</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Copy Prompt Button */}
        <TouchableOpacity style={styles.copyPromptButton} onPress={handleCopyPrompt}>
          <Text style={styles.copyPromptIcon}>📋</Text>
          <Text style={styles.copyPromptText}>Copy ChatGPT Prompt</Text>
        </TouchableOpacity>

        {/* Mode Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, mode === 'paste' && styles.activeTab]}
            onPress={() => setMode('paste')}
          >
            <Text style={[styles.tabText, mode === 'paste' && styles.activeTabText]}>
              📝 Paste JSON
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'file' && styles.activeTab]}
            onPress={() => setMode('file')}
          >
            <Text style={[styles.tabText, mode === 'file' && styles.activeTabText]}>
              📄 Upload File
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'paste' ? (
          <View style={styles.modeContent}>
            <Text style={styles.instructionText}>
              Paste the JSON recipe from ChatGPT below.
            </Text>

            <TextInput
              style={styles.jsonInput}
              multiline
              placeholder="Paste your recipe JSON here..."
              value={jsonText}
              onChangeText={setJsonText}
              textAlignVertical="top"
              c
            />

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
          </View>
        ) : (
          <View style={styles.modeContent}>
            <Text style={styles.instructionText}>
              Upload a JSON file generated by ChatGPT containing your recipe details.
            </Text>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickDocument}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.uploadIcon}>📄</Text>
                  <Text style={styles.uploadButtonText}>Choose JSON File</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  copyPromptButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    margin: 20,
    marginBottom: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyPromptIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  copyPromptText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  modeContent: {
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  jsonInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 200,
    maxHeight: 300,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  exampleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  exampleBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exampleCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
});
