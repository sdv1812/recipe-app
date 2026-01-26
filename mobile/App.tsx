import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootStackParamList, TabParamList } from "./src/navigation/types";
import HomeScreen from "./src/screens/HomeScreen";
import AddRecipeScreen from "./src/screens/AddRecipeScreen";
import RecipeDetailScreen from "./src/screens/RecipeDetailScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import PreferencesScreen from "./src/screens/PreferencesScreen";
import SettingsDrawer from "./src/screens/SettingsDrawer";
import ImportJsonScreen from "./src/screens/ImportJsonScreen";
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
        options={{
          tabBarLabel: "My Recipes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      >
        {(props) => <HomeScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen
        name="AIChef"
        component={AddRecipeScreen}
        options={{
          tabBarLabel: "AI Chef",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
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
            // Navigate to Settings modal instead
            navigation.navigate("Settings");
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
    <QueryClientProvider client={queryClient}>
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
              <Stack.Screen
                name="ImportJson"
                component={ImportJsonScreen}
                options={{
                  presentation: "modal",
                  animation: "slide_from_bottom",
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
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
