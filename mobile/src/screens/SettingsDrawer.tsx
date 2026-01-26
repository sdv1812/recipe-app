import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useUser } from "../utils/queries";

type SettingsDrawerProps = {
  onClose: () => void;
  onLogout: () => void;
};

export default function SettingsDrawer({
  onClose,
  onLogout,
}: SettingsDrawerProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Use React Query hook for user data
  const { data: user, isLoading } = useUser();

  const handlePreferences = () => {
    onClose();
    navigation.navigate("Preferences");
  };

  const handleImportJson = () => {
    onClose();
    navigation.navigate("ImportJson");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          onClose();
          onLogout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <Text style={styles.userName}>{user?.name || "User"}</Text>
              <Text style={styles.userEmail}>{user?.email || ""}</Text>
            </>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handlePreferences}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>My Preferences</Text>
              <Text style={styles.menuSubtitle}>
                Manage your dietary preferences
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleImportJson}>
            <Text style={styles.menuIcon}>📥</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Import Recipe JSON</Text>
              <Text style={styles.menuSubtitle}>
                Import recipes from JSON format
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.menuItem, styles.disabledMenuItem]}
            disabled
          >
            <Text style={styles.menuIcon}>🔒</Text>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, styles.disabledText]}>
                Change Password
              </Text>
              <Text style={styles.menuSubtitle}>Coming soon</Text>
            </View>
            <Text style={[styles.chevron, styles.disabledText]}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.menuItem, styles.disabledMenuItem]}
            disabled
          >
            <Text style={styles.menuIcon}>👤</Text>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, styles.disabledText]}>
                Manage Account
              </Text>
              <Text style={styles.menuSubtitle}>Coming soon</Text>
            </View>
            <Text style={[styles.chevron, styles.disabledText]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>SousAI Recipe App</Text>
          <Text style={styles.appInfoText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
    color: "#666",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  menuSection: {
    backgroundColor: "#fff",
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#999",
  },
  disabledText: {
    color: "#999",
  },
  chevron: {
    fontSize: 24,
    color: "#ccc",
    fontWeight: "300",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginLeft: 52,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
  },
  appInfo: {
    alignItems: "center",
    padding: 24,
    marginTop: 16,
  },
  appInfoText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
});
