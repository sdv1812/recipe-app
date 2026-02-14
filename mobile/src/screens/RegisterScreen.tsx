import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../utils/api";
import { authStorage } from "../utils/storage";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  onRegisterSuccess: () => void;
};

export default function RegisterScreen({
  navigation,
  onRegisterSuccess,
}: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await api.register(
        email.trim(),
        password,
        name.trim(),
      );

      // Save auth data
      await authStorage.saveAuth({ user, token });

      // Notify parent that registration was successful
      onRegisterSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";

      // Customize error messages for better UX
      let title = "Registration Failed";
      let displayMessage = message;

      if (message.includes("Unable to connect")) {
        title = "Connection Error";
        displayMessage =
          "Cannot reach the server. Please check your internet connection and try again.";
      } else if (message.includes("Server error")) {
        title = "Server Error";
        displayMessage =
          "The server is experiencing issues. Please try again in a few moments.";
      } else if (
        message.includes("already exists") ||
        message.includes("already registered")
      ) {
        displayMessage =
          "An account with this email already exists. Please use a different email or try logging in.";
      }

      Alert.alert(title, displayMessage);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join SousAI today</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={goToLogin}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Already have an account?{" "}
              <Text style={styles.linkTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.size["4xl"],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.sm,
    textAlign: "center",
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    marginBottom: Spacing["3xl"],
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: Typography.size.base,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text.primary,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.card,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  linkButton: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  linkText: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  linkTextBold: {
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
});
