import React, { useRef, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  userMessage: string;
  isGenerating: boolean;
  placeholder?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  renderMessageExtras?: (message: ChatMessage) => React.ReactNode;
}

export default function ChatInterface({
  chatHistory,
  userMessage,
  isGenerating,
  placeholder = "Type a message...",
  headerTitle,
  headerSubtitle,
  onMessageChange,
  onSendMessage,
  renderMessageExtras,
}: ChatInterfaceProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatHistory]);

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === "user";

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

          {renderMessageExtras && renderMessageExtras(message)}
        </View>

        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      {(headerTitle || headerSubtitle) && (
        <View style={styles.header}>
          {headerTitle && <Text style={styles.headerTitle}>{headerTitle}</Text>}
          {headerSubtitle && (
            <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
          )}
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
      >
        {chatHistory.map((message) => renderMessage(message))}

        {isGenerating && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.typingText}>AI Chef is cooking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={userMessage}
          onChangeText={onMessageChange}
          multiline
          maxLength={500}
          editable={!isGenerating}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!userMessage.trim() || isGenerating) && styles.sendButtonDisabled,
          ]}
          onPress={onSendMessage}
          disabled={!userMessage.trim() || isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={Colors.card} />
          ) : (
            <Ionicons name="send" size={20} color={Colors.card} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.card,
    paddingTop: 60,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.size["2xl"],
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: Spacing.base,
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
    paddingBottom: Spacing["2xl"],
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
