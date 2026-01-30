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
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";
import { useThread, useCreateThread, useSendMessage } from "../utils/queries";
import { ThreadMessage } from "../../../shared/types";

type Props = NativeStackScreenProps<RootStackParamList, "ChatModal">;

const SUGGESTION_CHIPS = [
  "Quick dinner",
  "Chicken + rice",
  "High protein",
  "Under 20 min",
];

export default function ChatModalScreen({ route, navigation }: Props) {
  const { threadId: existingThreadId, mode } = route.params;
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    existingThreadId,
  );
  const [userMessage, setUserMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  const createThread = useCreateThread();
  const sendMessage = useSendMessage();
  const { data: thread, isLoading: threadLoading } = useThread(
    currentThreadId || "",
  );

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [thread?.messages]);

  const handleSendMessage = async () => {
    if (
      !userMessage.trim() ||
      sendMessage.isPending ||
      createThread.isPending
    ) {
      return;
    }

    const messageText = userMessage.trim();
    setUserMessage("");

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
            },
            {
              onSuccess: (data) => {
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
          setUserMessage(messageText); // Restore the message
        },
      });
    } else if (currentThreadId) {
      // We already have a thread, just send the message
      sendMessage.mutate(
        {
          threadId: currentThreadId,
          message: messageText,
        },
        {
          onSuccess: (data) => {
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

  const renderMessage = (message: ThreadMessage) => {
    const isUser = message.role === "user";
    const hasRecipe = message.recipeData && !message.error;

    return (
      <View key={message.id} style={styles.messageContainer}>
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.content}
          </Text>

          {message.error && (
            <Text style={styles.errorText}>
              Could not format as recipe. Try again.
            </Text>
          )}
        </View>

        {hasRecipe && message.recipeData && (
          <TouchableOpacity
            style={styles.recipeCard}
            onPress={handleViewRecipe}
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
                <Text style={styles.actionText}>Tap to review</Text>
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
    <SafeAreaView style={styles.safeArea}>
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
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

        {/* Input */}
        <View style={styles.inputContainer}>
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
            onPress={handleSendMessage}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.card,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    paddingBottom: Platform.OS === "ios" ? Spacing.base : Spacing["2xl"],
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
});
