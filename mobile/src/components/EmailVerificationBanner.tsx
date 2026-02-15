import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";
import { api } from "../utils/api";
import { authStorage } from "../utils/storage";

interface EmailVerificationBannerProps {
  email: string;
  onDismiss?: () => void;
}

export default function EmailVerificationBanner({
  email,
  onDismiss,
}: EmailVerificationBannerProps) {
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.resendVerification(email);
      Alert.alert(
        "Email Sent",
        "Verification email has been sent. Please check your inbox.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send email";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={20} color={Colors.warning} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.message}>
            Please check your inbox and verify your email address to access all
            features.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleResend}
              disabled={loading}
              style={styles.resendButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.resendText}>Resend Email</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FEF3C7",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  content: {
    flexDirection: "row",
    padding: Spacing.md,
    alignItems: "flex-start",
  },
  iconContainer: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.subtitle,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 4,
  },
  message: {
    ...Typography.body,
    color: "#78350F",
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  resendButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    minWidth: 100,
    alignItems: "center",
  },
  resendText: {
    ...Typography.caption,
    color: Colors.background,
    fontWeight: "600",
  },
  dismissButton: {
    padding: 4,
  },
});
