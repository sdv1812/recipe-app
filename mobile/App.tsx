import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { RootStackParamList, TabParamList } from "./src/navigation/types";
import HomeScreen from "./src/screens/HomeScreen";
import RecipeDetailScreen from "./src/screens/RecipeDetailScreen";
import ChatModalScreen from "./src/screens/ChatModalScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";
import ChangePasswordScreen from "./src/screens/ChangePasswordScreen";
import PreferencesScreen from "./src/screens/PreferencesScreen";
import SettingsDrawer from "./src/screens/SettingsDrawer";
import GroceriesScreen from "./src/screens/GroceriesScreen";
import { authStorage } from "./src/utils/storage";
import { Colors } from "./src/constants/design";

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Bottom Tab Navigator Component
function MainTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#E5E5EA",
          paddingTop: 8,
          paddingBottom: 28, // Increased for iPhone home indicator
          height: 80, // Increased to accommodate bottom padding
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="MyRecipes"
        component={HomeScreen}
        options={{
          tabBarLabel: "My Recipes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Groceries"
        component={GroceriesScreen}
        options={{
          tabBarLabel: "Groceries",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={View}
        options={{
          tabBarLabel: "More",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default navigation
            e.preventDefault();
            // Navigate to Settings modal instead (use parent navigator)
            const parentNav = navigation.getParent();
            if (parentNav) {
              parentNav.navigate("Settings" as never);
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();

    // Register callback for handling 401 errors (token expiration)
    authStorage.setAuthErrorCallback(() => {
      setIsAuthenticated(false);
    });
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
    // Clear all React Query cache to remove previous user's data
    queryClient.clear();
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
    <ActionSheetProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer
          linking={{
            prefixes: ["recipeapp://"],
            config: {
              screens: {
                ResetPassword: "reset-password",
              },
            },
          }}
        >
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
                    <LoginScreen
                      {...props}
                      onLoginSuccess={handleAuthSuccess}
                    />
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
                <Stack.Screen
                  name="ForgotPassword"
                  component={ForgotPasswordScreen}
                />
                <Stack.Screen
                  name="ResetPassword"
                  component={ResetPasswordScreen}
                />
              </>
            ) : (
              // Main App Stack with Tabs
              <>
                <Stack.Screen name="MainTabs">
                  {(props) => <MainTabs {...props} onLogout={handleLogout} />}
                </Stack.Screen>
                <Stack.Screen
                  name="RecipeDetail"
                  component={RecipeDetailScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="ChatModal"
                  component={ChatModalScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="Preferences"
                  component={PreferencesScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    headerShown: true,
                    headerTitle: "My Preferences",
                  }}
                />
                <Stack.Screen
                  name="ChangePassword"
                  component={ChangePasswordScreen}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="Settings"
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    headerShown: false,
                  }}
                >
                  {(props) => (
                    <SettingsDrawer
                      {...props}
                      onClose={() => props.navigation.goBack()}
                      onLogout={handleLogout}
                    />
                  )}
                </Stack.Screen>
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </ActionSheetProvider>
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
