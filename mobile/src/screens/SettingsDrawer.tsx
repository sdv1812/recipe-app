import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useUser } from "../utils/queries";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/design";
import Loader from "../components/Loader";
import Header from "../components/Header";

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
      <Header title="Settings" showClose={true} onClose={onClose} />

      <ScrollView style={styles.content}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          {isLoading ? (
            <Loader size="small" />
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
            <Ionicons
              name="settings-outline"
              size={24}
              color={Colors.text.secondary}
              style={styles.menuIcon}
            />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>My Preferences</Text>
              <Text style={styles.menuSubtitle}>
                Manage your dietary preferences
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.border} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.menuItem, styles.disabledMenuItem]}
            disabled
          >
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color={Colors.text.secondary}
              style={styles.menuIcon}
            />
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, styles.disabledText]}>
                Change Password
              </Text>
              <Text style={styles.menuSubtitle}>Coming soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.border} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.menuItem, styles.disabledMenuItem]}
            disabled
          >
            <Ionicons
              name="person-outline"
              size={24}
              color={Colors.text.secondary}
              style={styles.menuIcon}
            />
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, styles.disabledText]}>
                Manage Account
              </Text>
              <Text style={styles.menuSubtitle}>Coming soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.border} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
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
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: Colors.card,
    padding: Spacing.xl,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.size["4xl"],
    fontWeight: Typography.weight.bold,
    color: Colors.card,
  },
  userName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  menuSection: {
    backgroundColor: Colors.card,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.card,
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  disabledText: {
    color: Colors.text.secondary,
  },
  chevron: {
    fontSize: Typography.size["2xl"],
    color: Colors.border,
    fontWeight: "300",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  logoutText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: "#DC2626",
  },
  appInfo: {
    alignItems: "center",
    padding: Spacing.xl,
    marginTop: Spacing.md,
  },
  appInfoText: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
});
