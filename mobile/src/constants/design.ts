/**
 * SousAI Design System
 * Calm, modern, premium aesthetic
 */

export const Colors = {
  // Primary
  primary: "#2563EB", // Deep Indigo Blue

  // Backgrounds
  background: "#F9FAFB", // Off-white
  card: "#FFFFFF", // White

  // Text
  text: {
    primary: "#111827", // Near-black
    secondary: "#6B7280", // Gray
  },

  // Borders & Dividers
  border: "#E5E7EB", // Light gray

  // Accent (use sparingly)
  accent: "#10B981", // Soft green - success states only

  // Utility
  error: "#EF4444",
  warning: "#F59E0B",
} as const;

export const Typography = {
  // Font Families
  fontFamily: {
    regular: "System", // iOS: SF Pro, Android: Roboto
    semibold: "System",
    medium: "System",
  },

  // Font Sizes
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
  },

  // Font Weights
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
} as const;

export const BorderRadius = {
  sm: 4,
  base: 8,
  md: 10,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
} as const;

export const Shadows = {
  // Subtle shadows only
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

// Component-specific design tokens
export const Components = {
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.base,
  },

  button: {
    primary: {
      backgroundColor: Colors.primary,
      color: "#FFFFFF",
      borderRadius: BorderRadius.base,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },
    secondary: {
      backgroundColor: "transparent",
      color: Colors.primary,
      borderRadius: BorderRadius.base,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.border,
    },
  },

  input: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    fontSize: Typography.size.base,
    color: Colors.text.primary,
  },

  tag: {
    backgroundColor: "#F3F4F6",
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
} as const;
