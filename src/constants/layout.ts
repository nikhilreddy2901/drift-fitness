/**
 * DRIFT FITNESS APP - THEME & LAYOUT CONSTANTS
 * Design system colors, spacing, and typography
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const Colors = {
  // Primary Brand Colors
  primary: {
    main: "#2563EB",      // Blue - Main brand color
    light: "#60A5FA",     // Light blue
    dark: "#1E40AF",      // Dark blue
    contrast: "#FFFFFF",  // White text on primary
  },

  // Muscle Group Colors (for buckets)
  muscleGroups: {
    push: "#EF4444",      // Red
    pull: "#10B981",      // Green
    legs: "#F59E0B",      // Orange
  },

  // Status Colors
  status: {
    success: "#10B981",   // Green
    warning: "#F59E0B",   // Orange
    error: "#EF4444",     // Red
    info: "#3B82F6",      // Blue
  },

  // Mood Colors (Check-In)
  mood: {
    great: "#10B981",     // Green
    okay: "#F59E0B",      // Orange
    rough: "#EF4444",     // Red
  },

  // Neutral/Background
  background: {
    primary: "#FFFFFF",   // White
    secondary: "#F9FAFB", // Light gray
    tertiary: "#F3F4F6",  // Medium gray
  },

  // Text
  text: {
    primary: "#111827",   // Near black
    secondary: "#6B7280", // Medium gray
    tertiary: "#9CA3AF",  // Light gray
    inverse: "#FFFFFF",   // White
  },

  // Borders
  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
    dark: "#9CA3AF",
  },

  // Exercise Slot Colors (Visual hierarchy)
  slots: {
    1: "#DC2626", // Red - Heavy compounds
    2: "#F59E0B", // Orange - Moderate compounds
    3: "#10B981", // Green - Isolations
  },

  // Equipment Colors
  equipment: {
    barbell: "#7C3AED",   // Purple
    dumbbell: "#EC4899",  // Pink
    machine: "#06B6D4",   // Cyan
    cable: "#8B5CF6",     // Violet
    bodyweight: "#14B8A6", // Teal
    smithMachine: "#A855F7", // Fuchsia
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },

  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ============================================================================
// SHADOWS (iOS & Android)
// ============================================================================

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

// ============================================================================
// LAYOUT
// ============================================================================

export const Layout = {
  screenPadding: Spacing.md,
  cardPadding: Spacing.md,
  maxContentWidth: 600,
};
