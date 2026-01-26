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
          <Text style={styles.sendButtonText}>
            {isGenerating ? "..." : "→"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  assistantBubble: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    marginLeft: 8,
  },
  userTimestamp: {
    textAlign: "right",
    marginRight: 8,
    marginLeft: 0,
  },
  typingContainer: {
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  typingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingBottom: 32,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
});
