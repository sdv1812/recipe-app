import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showClose?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  rightActions?: React.ReactNode; // For action buttons on the right
  children?: React.ReactNode; // For completely custom content
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  showClose = false,
  onBack,
  onClose,
  rightActions,
  children,
}: HeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.header}>
      {/* Left: Back or Close button */}
      {showBack && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}
      {showClose && (
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={Colors.text.secondary} />
        </TouchableOpacity>
      )}

      {/* Center: Title and subtitle OR custom children */}
      <View
        style={[
          styles.centerContent,
          (showBack || showClose) && styles.centerContentWithNav,
        ]}
      >
        {children ? (
          children
        ) : (
          <>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </>
        )}
      </View>

      {/* Right: Actions or spacer */}
      {rightActions ? (
        <View style={styles.rightActions}>{rightActions}</View>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  backButtonText: {
    fontSize: Typography.size.base,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
  closeButton: {},
  centerContent: {
    flex: 1,
    justifyContent: "center",
  },
  centerContentWithNav: {
    marginLeft: Spacing.md,
  },
  title: {
    fontSize: Typography.size["2xl"],
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    textAlign: "left",
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    textAlign: "left",
    marginTop: Spacing.xs,
  },
  spacer: {
    width: 60, // Matches back button width for balance
  },
  rightActions: {
    alignItems: "flex-end",
  },
});
