import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { SafeAreaView } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";
import {
  useThread,
  useCreateThread,
  useSendMessage,
  useCreateRecipe,
  useUpdateRecipe,
  useUpdateThread,
} from "../utils/queries";
import { ThreadMessage, RecipeImport } from "../../../shared/types";
import RecipePreviewModal from "../components/RecipePreviewModal";

type Props = NativeStackScreenProps<RootStackParamList, "ChatModal">;

const SUGGESTION_CHIPS = [
  "Quick dinner",
  "Chicken + rice",
  "High protein",
  "Under 20 min",
];

type ScanSource = "camera" | "library";
type ScanAction = "scan_recipe_ocr" | "scan_ingredients_image";

const QUICK_ACTION_CHIPS: Array<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: ScanAction;
  source: ScanSource;
}> = [
  {
    label: "Recipe from camera",
    icon: "camera-outline",
    action: "scan_recipe_ocr",
    source: "camera",
  },
  {
    label: "Recipe from library",
    icon: "images-outline",
    action: "scan_recipe_ocr",
    source: "library",
  },
  {
    label: "Ingredients from camera",
    icon: "nutrition-outline",
    action: "scan_ingredients_image",
    source: "camera",
  },
  {
    label: "Ingredients from library",
    icon: "image-outline",
    action: "scan_ingredients_image",
    source: "library",
  },
];

export default function ChatModalScreen({ route, navigation }: Props) {
  const {
    threadId: existingThreadId,
    mode,
    initialAction,
    initialImageData,
    initialMessage,
  } = route.params;
  const { showActionSheetWithOptions } = useActionSheet();
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    existingThreadId,
  );
  const [userMessage, setUserMessage] = useState("");
  const [recipeDraft, setRecipeDraft] = useState<RecipeImport | null>(null);
  const [showRecipePreview, setShowRecipePreview] = useState(false);
  const [previewRecipe, setPreviewRecipe] = useState<RecipeImport | null>(null);
  const [previewMode, setPreviewMode] = useState<"draft" | "view">("draft");
  const [expandedScannedText, setExpandedScannedText] = useState<string | null>(
    null,
  );
  const scrollViewRef = useRef<ScrollView>(null);

  const createThread = useCreateThread();
  const sendMessage = useSendMessage();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const updateThread = useUpdateThread();
  const { data: thread, isLoading: threadLoading } = useThread(
    currentThreadId || "",
  );

  const isSaving =
    createRecipe.isPending || updateRecipe.isPending || updateThread.isPending;

  const initialActionSentRef = useRef(false);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [thread?.messages]);

  useEffect(() => {
    if (initialActionSentRef.current) return;
    if (!initialAction || !initialImageData) return;

    initialActionSentRef.current = true;
    handleSendMessage(initialMessage ?? "", initialAction, initialImageData);
  }, [initialAction, initialImageData, initialMessage]);

  // Image flows are driven by quick-action chips; the camera icon is a fast path.

  const handleSendMessage = async (
    messageOverride?: string,
    action?: ScanAction,
    imageData?: string,
  ) => {
    const messageText = messageOverride ?? userMessage.trim();

    if (
      (!messageText && !action) ||
      sendMessage.isPending ||
      createThread.isPending
    ) {
      return;
    }

    if (!action) {
      setUserMessage("");
    }

    // If we're in new mode and don't have a thread yet, create one first
    if (mode === "new" && !currentThreadId) {
      createThread.mutate(undefined, {
        onSuccess: (newThread) => {
          setCurrentThreadId(newThread.id);
          // Now send the message to the newly created thread
          sendMessage.mutate(
            {
              threadId: newThread.id,
              message: messageText,
              action,
              imageData,
            },
            {
              onSuccess: (data) => {
                if (data.recipeDraft) {
                  setRecipeDraft(data.recipeDraft);
                }
                if (data.recipeCreated) {
                  console.log("Recipe created:", data.recipe?.title);
                }
              },
              onError: (error) => {
                Alert.alert(
                  "Error",
                  "Failed to send message. Please try again.",
                );
              },
            },
          );
        },
        onError: (error) => {
          Alert.alert("Error", "Failed to create chat. Please try again.");
          if (!action) {
            setUserMessage(messageText); // Restore the message
          }
        },
      });
    } else if (currentThreadId) {
      // We already have a thread, just send the message
      sendMessage.mutate(
        {
          threadId: currentThreadId,
          message: messageText,
          action,
          imageData,
        },
        {
          onSuccess: (data) => {
            if (data.recipeDraft) {
              setRecipeDraft(data.recipeDraft);
            }
            if (data.recipeCreated) {
              console.log("Recipe created:", data.recipe?.title);
            }
          },
          onError: (error) => {
            Alert.alert("Error", "Failed to send message. Please try again.");
          },
        },
      );
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setUserMessage(suggestion);
  };

  const handleViewRecipe = () => {
    if (thread?.recipeId) {
      navigation.navigate("RecipeDetail", {
        recipeId: thread.recipeId,
        fromChat: true,
      });
    }
  };

  const handlePreviewRecipe = () => {
    if (recipeDraft) {
      setPreviewRecipe(recipeDraft);
      setPreviewMode("draft");
      setShowRecipePreview(true);
    }
  };

  const handleClosePreview = () => {
    setShowRecipePreview(false);
    setPreviewRecipe(null);
    setPreviewMode("draft");
  };

  const handleUseThisRecipeInstead = (recipe: RecipeImport) => {
    // If a recipe is already saved for this thread, treat this as an immediate swap/update.
    if (thread?.recipeId) {
      handleSaveRecipe(recipe);
      return;
    }

    // Otherwise, set it as the active draft the user can continue iterating on.
    setRecipeDraft(recipe);
    handleClosePreview();
  };

  const handleRecipeCardPress = (cardRecipe: RecipeImport) => {
    // Always preview the exact recipe attached to this card.
    setPreviewRecipe(cardRecipe);
    setPreviewMode("view");
    setShowRecipePreview(true);
  };

  const handleSaveRecipe = async (recipe?: RecipeImport) => {
    const recipeToSave = recipe || recipeDraft;
    if (!recipeToSave || !currentThreadId) return;
    if (isSaving) return;

    try {
      let recipeIdToView: string | undefined;

      if (thread?.recipeId) {
        await updateRecipe.mutateAsync({
          recipeId: thread.recipeId,
          updates: {
            title: recipeToSave.title,
            description: recipeToSave.description,
            servings: recipeToSave.servings,
            prepTimeMinutes: recipeToSave.prepTimeMinutes,
            marinateTimeMinutes: recipeToSave.marinateTimeMinutes,
            cookTimeMinutes: recipeToSave.cookTimeMinutes,
            category: recipeToSave.category || [],
            tags: recipeToSave.tags || [],
            ingredients: recipeToSave.ingredients,
            preparationSteps: recipeToSave.preparationSteps as any,
            cookingSteps: recipeToSave.cookingSteps as any,
            shoppingList: recipeToSave.shoppingList as any,
          },
        });

        recipeIdToView = thread.recipeId;
      } else {
        const created = await createRecipe.mutateAsync({
          ...(recipeToSave as any),
          threadId: currentThreadId,
        });
        await updateThread.mutateAsync({
          threadId: currentThreadId,
          updates: {
            recipeId: created.id,
            status: "recipe_created",
            title: created.title,
          },
        });

        recipeIdToView = created.id;
      }

      setRecipeDraft(null);
      handleClosePreview();

      Alert.alert(
        "Saved",
        thread?.recipeId ? "Recipe updated." : "Recipe saved.",
        [
          {
            text: "View",
            onPress: () => {
              if (recipeIdToView) {
                navigation.navigate("RecipeDetail", {
                  recipeId: recipeIdToView,
                  fromChat: true,
                });
              }
            },
          },
          { text: "OK" },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save recipe",
      );
    }
  };

  const handleExpandScannedText = (text: string) => {
    setExpandedScannedText(text);
  };

  const handleUseScannedText = (text: string) => {
    setUserMessage(text);
    setExpandedScannedText(null);
  };

  const startImageFlow = async (action: ScanAction, source: ScanSource) => {
    if (sendMessage.isPending || createThread.isPending) return;

    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera access to scan images",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        handleSendMessage("", action, result.assets[0].base64);
      }
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant photo library access to scan images",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      handleSendMessage("", action, result.assets[0].base64);
    }
  };

  const handleAttachmentPress = () => {
    const options = [
      "Recipe from Camera",
      "Recipe from Library",
      "Ingredients from Camera",
      "Ingredients from Library",
      "Cancel",
    ];
    const icons = [
      <Ionicons name="camera-outline" size={24} color={Colors.text.primary} />,
      <Ionicons name="images-outline" size={24} color={Colors.text.primary} />,
      <Ionicons
        name="nutrition-outline"
        size={24}
        color={Colors.text.primary}
      />,
      <Ionicons name="image-outline" size={24} color={Colors.text.primary} />,
      <Ionicons
        name="close-circle-outline"
        size={24}
        color={Colors.text.secondary}
      />,
    ];

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 4,
        icons,
        title: "Add Image",
        message: "Choose what you want to scan",
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          startImageFlow("scan_recipe_ocr", "camera");
        } else if (buttonIndex === 1) {
          startImageFlow("scan_recipe_ocr", "library");
        } else if (buttonIndex === 2) {
          startImageFlow("scan_ingredients_image", "camera");
        } else if (buttonIndex === 3) {
          startImageFlow("scan_ingredients_image", "library");
        }
      },
    );
  };

  const renderMessage = (message: ThreadMessage) => {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";
    const hasRecipeCard = Boolean(message.recipeData && !message.error);
    const hasScannedText = message.scannedText;

    // Handle scanned text system messages
    if (isSystem && hasScannedText) {
      const preview = message.scannedText!.slice(0, 250);
      const hasMore = message.scannedText!.length > 250;
      const isExpanded = expandedScannedText === message.scannedText;

      const isIngredientDetection = message.content.includes("Detected");
      const headerTitle = isIngredientDetection
        ? "Detected Items"
        : "Scanned Text";
      const headerIcon = isIngredientDetection
        ? "nutrition-outline"
        : "document-text-outline";

      return (
        <View key={message.id} style={styles.messageContainer}>
          <View style={[styles.messageBubble, styles.systemBubble]}>
            <View style={styles.scannedTextHeader}>
              <Ionicons name={headerIcon} size={20} color={Colors.primary} />
              <Text style={styles.scannedTextTitle}>{headerTitle}</Text>
            </View>

            <Text style={styles.scannedTextContent}>
              {isExpanded ? message.scannedText : preview}
              {hasMore && !isExpanded && "..."}
            </Text>

            <View style={styles.scannedTextActions}>
              {hasMore && (
                <TouchableOpacity
                  style={styles.scannedTextButton}
                  onPress={() =>
                    isExpanded
                      ? setExpandedScannedText(null)
                      : handleExpandScannedText(message.scannedText!)
                  }
                >
                  <Text style={styles.scannedTextButtonText}>
                    {isExpanded ? "Show Less" : "Expand"}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.scannedTextButton,
                  styles.scannedTextButtonPrimary,
                ]}
                onPress={() => handleUseScannedText(message.scannedText!)}
              >
                <Text style={styles.scannedTextButtonTextPrimary}>
                  Use This Text
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scannedTextButton}
                onPress={handleAttachmentPress}
              >
                <Text style={styles.scannedTextButtonText}>Rescan</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      );
    }

    return (
      <View key={message.id} style={styles.messageContainer}>
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {isUser ? (
            <Text style={[styles.messageText, styles.userMessageText]}>
              {message.content}
            </Text>
          ) : (
            <Markdown
              style={{
                body: {
                  color: Colors.text.primary,
                  fontSize: Typography.size.base,
                  lineHeight:
                    Typography.size.base * Typography.lineHeight.normal,
                },
                heading1: {
                  fontSize: Typography.size.xl,
                  fontWeight: Typography.weight.bold,
                  color: Colors.text.primary,
                  marginTop: Spacing.sm,
                  marginBottom: Spacing.xs,
                },
                heading2: {
                  fontSize: Typography.size.lg,
                  fontWeight: Typography.weight.semibold,
                  color: Colors.text.primary,
                  marginTop: Spacing.sm,
                  marginBottom: Spacing.xs,
                },
                heading3: {
                  fontSize: Typography.size.base,
                  fontWeight: Typography.weight.semibold,
                  color: Colors.text.primary,
                  marginTop: Spacing.xs,
                  marginBottom: Spacing.xs,
                },
                strong: {
                  fontWeight: Typography.weight.bold,
                  color: Colors.text.primary,
                },
                em: {
                  fontStyle: "italic",
                },
                paragraph: {
                  marginTop: 0,
                  marginBottom: Spacing.sm,
                },
                bullet_list: {
                  marginTop: Spacing.xs,
                  marginBottom: Spacing.sm,
                },
                ordered_list: {
                  marginTop: Spacing.xs,
                  marginBottom: Spacing.sm,
                },
                list_item: {
                  marginBottom: Spacing.xs,
                },
                code_inline: {
                  backgroundColor: Colors.background,
                  color: Colors.primary,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 4,
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                },
                fence: {
                  backgroundColor: Colors.background,
                  padding: Spacing.sm,
                  borderRadius: BorderRadius.md,
                  marginVertical: Spacing.xs,
                },
              }}
            >
              {message.content}
            </Markdown>
          )}

          {message.error && (
            <Text style={styles.errorText}>
              Could not format as recipe. Try again.
            </Text>
          )}
        </View>

        {hasRecipeCard && message.recipeData && (
          <TouchableOpacity
            style={styles.recipeCard}
            onPress={() => handleRecipeCardPress(message.recipeData!)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {message.recipeData.title}
              </Text>

              {message.recipeData.description && (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {message.recipeData.description}
                </Text>
              )}

              <View style={styles.cardMeta}>
                {message.recipeData.servings && (
                  <Text style={styles.metaText}>
                    {message.recipeData.servings} servings
                  </Text>
                )}
                {message.recipeData.cookTimeMinutes && (
                  <>
                    <Text style={styles.metaDivider}>•</Text>
                    <Text style={styles.metaText}>
                      {message.recipeData.cookTimeMinutes} min
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.cardAction}>
                <Text style={styles.actionText}>Preview Recipe</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  const threadTitle =
    thread?.status === "recipe_created" && thread.title
      ? thread.title
      : "New chat";
  const messages = thread?.messages || [];
  const isEmpty = messages.length === 0;
  const isLoading = mode === "existing" && threadLoading;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{threadTitle}</Text>
        <View style={styles.headerRight}>
          {/* Optional: Add overflow menu button here */}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Chat Messages */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
          >
            {isEmpty && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  Ask SousAI to create a recipe
                </Text>
                <Text style={styles.emptySubtitle}>
                  Describe what you want to cook
                </Text>
                <View style={styles.suggestionsContainer}>
                  {SUGGESTION_CHIPS.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() => handleSuggestionPress(suggestion)}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.quickActionsContainer}>
                  {QUICK_ACTION_CHIPS.map((chip) => (
                    <TouchableOpacity
                      key={`${chip.action}-${chip.source}-${chip.label}`}
                      style={styles.quickActionChip}
                      onPress={() => startImageFlow(chip.action, chip.source)}
                      disabled={sendMessage.isPending || isLoading}
                    >
                      <Ionicons
                        name={chip.icon}
                        size={16}
                        color={Colors.text.secondary}
                        style={{ marginRight: Spacing.xs }}
                      />
                      <Text style={styles.quickActionText}>{chip.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {messages.map((message) => renderMessage(message))}

            {sendMessage.isPending && (
              <View style={styles.typingContainer}>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={styles.typingText}>SousAI is cooking...</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Recipe Draft Actions */}
        {recipeDraft && (
          <View style={styles.recipeDraftActions}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={handlePreviewRecipe}
              disabled={isSaving}
            >
              <Ionicons
                name="eye-outline"
                size={20}
                color={Colors.text.secondary}
              />
              <Text style={styles.previewButtonText}>Preview Recipe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSaveRecipe()}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.card} />
              ) : (
                <Ionicons name="checkmark" size={20} color={Colors.card} />
              )}
              <Text style={styles.saveButtonText}>
                {thread?.recipeId ? "Apply Update" : "Save Recipe"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleAttachmentPress}
            disabled={sendMessage.isPending || isLoading}
          >
            <Ionicons
              name="attach-outline"
              size={24}
              color={
                sendMessage.isPending || isLoading
                  ? Colors.border
                  : Colors.text.secondary
              }
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Ask SousAI to create a recipe..."
            value={userMessage}
            onChangeText={setUserMessage}
            multiline
            maxLength={5000}
            editable={!sendMessage.isPending && !isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!userMessage.trim() || sendMessage.isPending || isLoading) &&
                styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!userMessage.trim() || sendMessage.isPending || isLoading}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" color={Colors.card} />
            ) : (
              <Ionicons name="send" size={20} color={Colors.card} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Recipe Preview Modal */}
      {(previewRecipe || recipeDraft) && (
        <RecipePreviewModal
          visible={showRecipePreview}
          recipe={previewRecipe || recipeDraft!}
          mode={previewMode}
          saveLabel={
            previewMode === "draft"
              ? thread?.recipeId
                ? "Apply Update"
                : "Save Recipe"
              : undefined
          }
          onDiscard={handleClosePreview}
          onSave={handleSaveRecipe}
          onUseThisRecipeInstead={
            previewMode === "view" ? handleUseThisRecipeInstead : undefined
          }
          isSaving={isSaving}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: Spacing.base,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: Spacing["4xl"],
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
  },
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    fontSize: Typography.size.sm,
    color: Colors.text.primary,
  },
  quickActionsContainer: {
    marginTop: Spacing.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  quickActionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: Typography.size.sm,
    color: Colors.text.primary,
    fontWeight: Typography.weight.medium,
  },
  messageContainer: {
    marginBottom: Spacing.base,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    alignSelf: "flex-end",
  },
  assistantBubble: {
    backgroundColor: Colors.card,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: Typography.size.base,
    color: Colors.text.primary,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
  },
  userMessageText: {
    color: Colors.card,
  },
  errorText: {
    fontSize: Typography.size.sm,
    color: "#DC2626",
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  recipeCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    overflow: "hidden",
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  cardContent: {
    padding: Spacing.base,
  },
  cardTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.size.lg * Typography.lineHeight.tight,
  },
  cardDescription: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  metaText: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
  },
  metaDivider: {
    fontSize: Typography.size.xs,
    color: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  cardAction: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.primary,
    textAlign: "center",
  },
  timestamp: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  userTimestamp: {
    textAlign: "right",
    marginRight: Spacing.sm,
    marginLeft: 0,
  },
  typingContainer: {
    marginBottom: Spacing.base,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    alignSelf: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typingText: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    padding: Spacing.base,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: Typography.size.base,
    maxHeight: 100,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
  systemBubble: {
    backgroundColor: Colors.background,
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  scannedTextHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  scannedTextTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  scannedTextContent: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.size.sm * 1.4,
    marginBottom: Spacing.sm,
  },
  scannedTextActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  scannedTextButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  scannedTextButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scannedTextButtonText: {
    fontSize: Typography.size.sm,
    color: Colors.text.primary,
  },
  scannedTextButtonTextPrimary: {
    fontSize: Typography.size.sm,
    color: Colors.card,
    fontWeight: Typography.weight.semibold,
  },
  recipeDraftActions: {
    flexDirection: "row",
    padding: Spacing.base,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  previewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  previewButtonText: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.semibold,
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    gap: Spacing.xs,
  },
  saveButtonText: {
    fontSize: Typography.size.base,
    color: Colors.card,
    fontWeight: Typography.weight.semibold,
  },
  attachButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 44,
    height: 44,
    marginRight: Spacing.xs,
  },
});
