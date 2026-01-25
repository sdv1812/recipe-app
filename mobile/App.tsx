import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { RootStackParamList } from "./src/navigation/types";
import HomeScreen from "./src/screens/HomeScreen";
import AddRecipeScreen from "./src/screens/AddRecipeScreen";
import RecipeDetailScreen from "./src/screens/RecipeDetailScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import { authStorage } from "./src/utils/storage";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authStorage.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await authStorage.clearAuth();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen {...props} onLoginSuccess={handleAuthSuccess} />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {(props) => (
                <RegisterScreen
                  {...props}
                  onRegisterSuccess={handleAuthSuccess}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="Home">
              {(props) => <HomeScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="AddRecipe" component={AddRecipeScreen} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
