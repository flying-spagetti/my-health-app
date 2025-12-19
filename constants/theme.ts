/**
 * Design system tokens for the health tracker app
 * Following the requirements for a calm, minimal, Apple-Health-meets-Headspace aesthetic
 */

import { Platform } from 'react-native';

// Base colors for the health app
// Calm, minimal palette inspired by premium wellness apps
const primaryColor = '#4F46E5';  // indigo-600
const successColor = '#22C55E';  // green-500
const dangerColor = '#EF4444';   // red-500
const accentColor = '#F97316';   // orange-500

// Dark theme (default as per requirements)
export const darkTheme = {
  colors: {
    // Core surfaces
    background: '#020617',    // app background
    surface: '#020617',       // main surface
    elevatedSurface: '#020617', // slightly elevated surface (cards)
    card: '#020617',
    border: '#1E293B',
    
    // Text colors
    text: '#E5E7EB',           // Primary text (gray-200)
    textSecondary: '#9CA3AF',  // Secondary text (gray-400)
    textMuted: '#6B7280',      // Muted text (gray-500)
    
    // Brand colors
    primary: primaryColor,
    primaryLight: '#6366F1',
    primaryDark: '#4338CA',
    
    // Status colors
    success: successColor,
    warning: '#F59E0B',
    danger: dangerColor,
    info: '#3B82F6',
    
    // Accent colors
    accent: accentColor,
    accentLight: '#FDBA74',
    
    // Navigation
    tint: '#E5E7EB',
    tabIconDefault: '#6B7280',
    tabIconSelected: primaryColor,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    caption: 14,
    small: 12,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Light theme (modern health app design)
export const lightTheme = {
  colors: {
    // Core surfaces - light, clean background
    background: '#FFFFFF',
    surface: '#F8F9FA',
    elevatedSurface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E5E7EB',
    
    // Text colors
    text: '#111827',
    textSecondary: '#374151',
    textMuted: '#6B7280',
    
    // Brand colors - modern blue
    primary: '#3B82F6',  // blue-500
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    
    // Status colors
    success: '#10B981',  // green-500
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    
    // Accent colors
    accent: '#8B5CF6',  // purple-500
    accentLight: '#A78BFA',
    
    // Activity colors
    activityBlue: '#3B82F6',
    activityRed: '#EF4444',
    activityGreen: '#10B981',
    
    // Navigation
    tint: '#3B82F6',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#3B82F6',
  },
  spacing: darkTheme.spacing,
  borderRadius: darkTheme.borderRadius,
  typography: darkTheme.typography,
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

// Helper to get tokens for a given color scheme
export function getThemeTokens(colorScheme: 'light' | 'dark' | null | undefined) {
  if (colorScheme === 'light') {
    return lightTheme;
  }
  return darkTheme;
}

// Default tokens (used when no scheme is available)
export const tokens = darkTheme;

// Legacy Colors export for compatibility
export const Colors = {
  light: {
    text: lightTheme.colors.text,
    background: lightTheme.colors.background,
    tint: lightTheme.colors.tint,
    icon: lightTheme.colors.tabIconDefault,
    tabIconDefault: lightTheme.colors.tabIconDefault,
    tabIconSelected: lightTheme.colors.tabIconSelected,
  },
  dark: {
    text: darkTheme.colors.text,
    background: darkTheme.colors.background,
    tint: darkTheme.colors.tint,
    icon: darkTheme.colors.tabIconDefault,
    tabIconDefault: darkTheme.colors.tabIconDefault,
    tabIconSelected: darkTheme.colors.tabIconSelected,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
