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

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  onLoginSuccess: () => void;
};

export default function LoginScreen({
  navigation,
  onLoginSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await api.login(email.trim(), password);

      // Save auth data
      await authStorage.saveAuth({ user, token });

      // Notify parent that login was successful
      onLoginSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";

      // Customize error messages for better UX
      let title = "Login Failed";
      let displayMessage = message;

      if (message.includes("Unable to connect")) {
        title = "Connection Error";
        displayMessage =
          "Cannot reach the server. Please check your internet connection and try again.";
      } else if (message.includes("Server error")) {
        title = "Server Error";
        displayMessage =
          "The server is experiencing issues. Please try again in a few moments.";
      } else if (message.includes("migration required")) {
        title = "Account Update Required";
        displayMessage =
          "Your account needs to be updated. Please contact support for assistance.";
      } else if (message.includes("Invalid email or password")) {
        displayMessage =
          "The email or password you entered is incorrect. Please try again.";
      }

      Alert.alert(title, displayMessage);
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to SousAI</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
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

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={goToRegister}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Don't have an account?{" "}
              <Text style={styles.linkTextBold}>Sign Up</Text>
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
