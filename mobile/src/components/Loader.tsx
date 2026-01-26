import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Colors, Typography, Spacing } from "../constants/design";

interface LoaderProps {
  text?: string;
  size?: "small" | "large";
}

export default function Loader({ text, size = "large" }: LoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
  },
});
