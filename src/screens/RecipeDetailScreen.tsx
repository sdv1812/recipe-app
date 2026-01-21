import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Recipe, PreparationStep, CookingStep, ShoppingItem } from '../types/recipe';
import { storageUtils } from '../utils/storage';
import { shareRecipe } from '../utils/recipeShare';

type RecipeDetailRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;
type RecipeDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecipeDetail'>;

export default function RecipeDetailScreen() {
  const navigation = useNavigation<RecipeDetailNavigationProp>();
  const route = useRoute<RecipeDetailRouteProp>();
  const { recipeId } = route.params;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'prep' | 'cooking' | 'shopping'>('ingredients');

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    const loadedRecipe = await storageUtils.getRecipeById(recipeId);
    if (loadedRecipe) {
      setRecipe(loadedRecipe);
    } else {
      Alert.alert('Error', 'Recipe not found', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const toggleStepCompletion = async (type: 'prep' | 'cooking', stepNumber: number) => {
    if (!recipe) return;

    const updatedRecipe = { ...recipe };
    
    if (type === 'prep') {
      const step = updatedRecipe.preparationSteps.find(s => s.stepNumber === stepNumber);
      if (step) step.completed = !step.completed;
    } else {
      const step = updatedRecipe.cookingSteps.find(s => s.stepNumber === stepNumber);
      if (step) step.completed = !step.completed;
    }

    await storageUtils.updateRecipe(updatedRecipe);
    setRecipe(updatedRecipe);
  };

  const toggleShoppingItem = async (itemId: string) => {
    if (!recipe) return;

    const updatedRecipe = { ...recipe };
    const item = updatedRecipe.shoppingList.find(i => i.id === itemId);
    if (item) {
      item.purchased = !item.purchased;
    }

    await storageUtils.updateRecipe(updatedRecipe);
    setRecipe(updatedRecipe);
  };

  const formatTimeBreakdown = () => {
    if (!recipe) return '';
    const times: string[] = [];
    if (recipe.prepTimeMinutes) times.push(`Prep: ${recipe.prepTimeMinutes}m`);
    if (recipe.marinateTimeMinutes) {
      const hours = Math.floor(recipe.marinateTimeMinutes / 60);
      const mins = recipe.marinateTimeMinutes % 60;
      if (hours > 0) {
        times.push(`Marinate: ${hours}h${mins > 0 ? ` ${mins}m` : ''}`);
      } else {
        times.push(`Marinate: ${mins}m`);
      }
    }
    if (recipe.cookTimeMinutes) times.push(`Cook: ${recipe.cookTimeMinutes}m`);
    return times.join(' | ');
  };

  const handleShare = async () => {
    if (!recipe) return;
    
    try {
      await shareRecipe(recipe);
    } catch (error) {
      Alert.alert('Share Failed', 'Could not share recipe. Please try again.');
    }
  };

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>Share 📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}
          <View style={styles.metadata}>
            {recipe.servings && (
              <Text style={styles.metadataItem}>🍽️ {recipe.servings} servings</Text>
            )}
            {formatTimeBreakdown() && (
              <Text style={styles.metadataItem}>⏱️ {formatTimeBreakdown()}</Text>
            )}
          </View>
          {recipe.category.length > 0 && (
            <View style={styles.chipsContainer}>
              <Text style={styles.chipsLabel}>Categories:</Text>
              <View style={styles.chipsWrapper}>
                {recipe.category.map((cat, index) => (
                  <View key={index} style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {recipe.tags.length > 0 && (
            <View style={styles.chipsContainer}>
              <Text style={styles.chipsLabel}>Tags:</Text>
              <View style={styles.chipsWrapper}>
                {recipe.tags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ingredients' && styles.activeTab]}
            onPress={() => setActiveTab('ingredients')}
          >
            <Text style={[styles.tabText, activeTab === 'ingredients' && styles.activeTabText]}>
              Ingredients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'prep' && styles.activeTab]}
            onPress={() => setActiveTab('prep')}
          >
            <Text style={[styles.tabText, activeTab === 'prep' && styles.activeTabText]}>
              Prep
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'cooking' && styles.activeTab]}
            onPress={() => setActiveTab('cooking')}
          >
            <Text style={[styles.tabText, activeTab === 'cooking' && styles.activeTabText]}>
              Cooking
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'shopping' && styles.activeTab]}
            onPress={() => setActiveTab('shopping')}
          >
            <Text style={[styles.tabText, activeTab === 'shopping' && styles.activeTabText]}>
              Shopping
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'ingredients' && (
            <View>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientBullet}>•</Text>
                  <Text style={styles.ingredientText}>
                    {ingredient.quantity} {ingredient.unit || ''} {ingredient.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'prep' && (
            <View>
              {recipe.preparationSteps.map((step) => (
                <TouchableOpacity
                  key={step.stepNumber}
                  style={styles.stepItem}
                  onPress={() => toggleStepCompletion('prep', step.stepNumber)}
                >
                  <Text style={styles.stepCheckbox}>
                    {step.completed ? '✅' : '⬜'}
                  </Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepNumber}>Step {step.stepNumber}</Text>
                    <Text style={[styles.stepText, step.completed && styles.completedText]}>
                      {step.instruction}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'cooking' && (
            <View>
              {recipe.cookingSteps.map((step) => (
                <TouchableOpacity
                  key={step.stepNumber}
                  style={styles.stepItem}
                  onPress={() => toggleStepCompletion('cooking', step.stepNumber)}
                >
                  <Text style={styles.stepCheckbox}>
                    {step.completed ? '✅' : '⬜'}
                  </Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepNumber}>Step {step.stepNumber}</Text>
                    <Text style={[styles.stepText, step.completed && styles.completedText]}>
                      {step.instruction}
                    </Text>
                    {step.duration && (
                      <Text style={styles.stepDuration}>⏱️ {step.duration}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'shopping' && (
            <View>
              {recipe.shoppingList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.shoppingItem}
                  onPress={() => toggleShoppingItem(item.id)}
                >
                  <Text style={styles.stepCheckbox}>
                    {item.purchased ? '✅' : '⬜'}
                  </Text>
                  <Text style={[styles.shoppingText, item.purchased && styles.completedText]}>
                    {item.quantity} {item.unit || ''} {item.name}
                  </Text>
                </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  shareButton: {
    padding: 8,
    paddingHorizontal: 12,
  },
  shareButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    lineHeight: 22,
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metadataItem: {
    fontSize: 14,
    color: '#999',
  },
  chipsContainer: {
    marginBottom: 12,
  },
  chipsLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 6,
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryChipText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  tagChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagChipText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  tabContent: {
    padding: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  ingredientBullet: {
    fontSize: 20,
    marginRight: 12,
    color: '#4CAF50',
  },
  ingredientText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  stepCheckbox: {
    fontSize: 24,
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepNumber: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  stepDuration: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  shoppingItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  shoppingText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});
