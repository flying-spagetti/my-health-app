/**
 * Design System Tokens for Health & Wellness Tracking App
 * Based on design.json - Warm, organic, hand-crafted aesthetic
 * 
 * Philosophy: Create a warm, inviting digital sanctuary that feels 
 * hand-crafted, not clinical. Every element should feel approachable,
 * like a supportive friend rather than a sterile medical tool.
 */

import { Platform } from 'react-native';

// ============================================
// COLOR PALETTE
// ============================================

// Background Colors - Muted, nature-inspired
export const backgrounds = {
  lavender: '#C5BFDC',    // Primary app background, dashboard
  sage: '#B8D4B4',        // Mood check-in, positive reinforcement
  cream: '#F7F6F2',       // Secondary screens, meditation
  softMint: '#D4E8D6',    // Lighter green accents
  white: '#FFFFFF',       // Forms, modals
};

// Surface Colors
export const surfaces = {
  cardWhite: '#FFFFFF',
  cardCream: '#FAFAF8',
  elevatedWhite: '#FFFFFF',
};

// Primary Colors - Sage Green
export const primary = {
  sageGreen: '#7BA17B',
  deepSage: '#5A8A5A',
  lightSage: '#A8CBA8',
};

// Accent Colors
export const accent = {
  periwinkle: '#6B7FD7',
  deepBlue: '#4A5FC1',
  coral: '#E88B6E',
  salmon: '#EDA08C',
  orchid: '#D4A5D9',
  teal: '#7AABAB',
};

// Text Colors
export const text = {
  primary: '#2D2D2D',
  secondary: '#5A5A5A',
  muted: '#8B8B8B',
  onDark: '#FFFFFF',
  handwritten: '#3D3D3D',
};

// Semantic Colors
export const semantic = {
  success: '#7BA17B',
  warning: '#E8B86E',
  error: '#D97B7B',
  info: '#6B7FD7',
};

// Mood Colors
export const moodColors = {
  joyful: '#F5D76E',
  calm: '#A8CBA8',
  drained: '#B8D4B4',
  anxious: '#D4A5D9',
  sad: '#7AABAB',
  energetic: '#E88B6E',
};

// ============================================
// TYPOGRAPHY
// ============================================

export const fontFamilies = {
  display: Platform.select({
    ios: 'Caveat-SemiBold',
    android: 'Caveat-SemiBold',
    default: 'Caveat-SemiBold',
  }),
  displayMedium: Platform.select({
    ios: 'Caveat-Medium',
    android: 'Caveat-Medium',
    default: 'Caveat-Medium',
  }),
  body: Platform.select({
    ios: 'Nunito-Regular',
    android: 'Nunito-Regular',
    default: 'Nunito-Regular',
  }),
  bodySemiBold: Platform.select({
    ios: 'Nunito-SemiBold',
    android: 'Nunito-SemiBold',
    default: 'Nunito-SemiBold',
  }),
  bodyBold: Platform.select({
    ios: 'Nunito-Bold',
    android: 'Nunito-Bold',
    default: 'Nunito-Bold',
  }),
  // Fallbacks for when custom fonts aren't loaded
  displayFallback: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'cursive',
  }),
  bodyFallback: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'system-ui',
  }),
};

export const typography = {
  displayLarge: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fontFamilies.display,
  },
  displayMedium: {
    fontSize: 26,
    lineHeight: 33,
    fontFamily: fontFamilies.display,
  },
  displaySmall: {
    fontSize: 22,
    lineHeight: 29,
    fontFamily: fontFamilies.displayMedium,
  },
  headingLarge: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamilies.bodySemiBold,
  },
  headingMedium: {
    fontSize: 17,
    lineHeight: 23,
    fontFamily: fontFamilies.bodySemiBold,
  },
  headingSmall: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fontFamilies.bodySemiBold,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fontFamilies.body,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fontFamilies.body,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fontFamilies.body,
  },
  label: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: fontFamilies.bodySemiBold,
  },
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamilies.body,
  },
};

// Legacy typography sizes (for backwards compatibility)
export const typographySizes = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  caption: 14,
  small: 12,
};

// ============================================
// SPACING
// ============================================

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
};

// Layout guidelines
export const layout = {
  screenPadding: 20,
  cardPadding: 16,
  cardMargin: 12,
  sectionGap: 24,
  elementGap: 12,
  inlineGap: 8,
  maxContentWidth: 428,
  gridColumns: 2,
  gridGap: 12,
};

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// ============================================
// SHADOWS
// ============================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  low: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  high: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 8,
  },
};

// ============================================
// THEME OBJECTS (Light/Dark)
// ============================================

// Light theme (Primary - matches design.json)
export const lightTheme = {
  colors: {
    // Backgrounds
    background: backgrounds.lavender,
    backgroundSecondary: backgrounds.cream,
    backgroundMood: backgrounds.sage,
    backgroundWellness: backgrounds.cream,
    backgroundHealth: backgrounds.lavender,
    
    // Surfaces
    surface: surfaces.cardWhite,
    elevatedSurface: surfaces.cardWhite,
    card: surfaces.cardWhite,
    cardSecondary: surfaces.cardCream,
    
    // Borders
    border: 'rgba(0, 0, 0, 0.05)',
    borderLight: 'rgba(0, 0, 0, 0.03)',
    
    // Text
    text: text.primary,
    textSecondary: text.secondary,
    textMuted: text.muted,
    textOnDark: text.onDark,
    textHandwritten: text.handwritten,
    
    // Primary (Sage Green)
    primary: primary.sageGreen,
    primaryLight: primary.lightSage,
    primaryDark: primary.deepSage,
    
    // Accents
    accent: accent.periwinkle,
    accentLight: accent.periwinkle + '40',
    coral: accent.coral,
    teal: accent.teal,
    orchid: accent.orchid,
    
    // Semantic
    success: semantic.success,
    warning: semantic.warning,
    danger: semantic.error,
    info: semantic.info,
    
    // Mood colors
    moodJoyful: moodColors.joyful,
    moodCalm: moodColors.calm,
    moodDrained: moodColors.drained,
    moodAnxious: moodColors.anxious,
    moodSad: moodColors.sad,
    moodEnergetic: moodColors.energetic,
    
    // Navigation
    tint: primary.sageGreen,
    tabIconDefault: text.muted,
    tabIconSelected: primary.sageGreen,
    
    // Button
    buttonPrimary: text.primary,
    buttonPrimaryText: text.onDark,
    buttonSecondary: primary.sageGreen,
    buttonSecondaryText: text.onDark,
  },
  
  spacing,
  borderRadius,
  typography: typographySizes,
  shadows,
};

// Dark theme (Adapted warm dark)
export const darkTheme = {
  colors: {
    // Backgrounds - Warm dark tones
    background: '#1A1A2E',
    backgroundSecondary: '#16213E',
    backgroundMood: '#1A2A1A',
    backgroundWellness: '#1E1E2E',
    backgroundHealth: '#1A1A2E',
    
    // Surfaces
    surface: '#252542',
    elevatedSurface: '#2D2D4A',
    card: '#252542',
    cardSecondary: '#2D2D4A',
    
    // Borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.04)',
    
    // Text
    text: '#E5E5E5',
    textSecondary: '#B0B0B0',
    textMuted: '#808080',
    textOnDark: '#FFFFFF',
    textHandwritten: '#E5E5E5',
    
    // Primary (Sage Green - slightly brighter for dark)
    primary: '#8FBC8F',
    primaryLight: '#A8CBA8',
    primaryDark: '#6B8E6B',
    
    // Accents
    accent: '#8B9FE8',
    accentLight: '#8B9FE840',
    coral: '#F0A080',
    teal: '#8BC0C0',
    orchid: '#E0B8E5',
    
    // Semantic
    success: '#8FBC8F',
    warning: '#F0C878',
    danger: '#E89090',
    info: '#8B9FE8',
    
    // Mood colors (adjusted for dark)
    moodJoyful: '#F5D76E',
    moodCalm: '#A8CBA8',
    moodDrained: '#90B090',
    moodAnxious: '#D4A5D9',
    moodSad: '#8BC0C0',
    moodEnergetic: '#F0A080',
    
    // Navigation
    tint: '#8FBC8F',
    tabIconDefault: '#808080',
    tabIconSelected: '#8FBC8F',
    
    // Button
    buttonPrimary: '#E5E5E5',
    buttonPrimaryText: '#1A1A2E',
    buttonSecondary: '#8FBC8F',
    buttonSecondaryText: '#1A1A2E',
  },
  
  spacing,
  borderRadius,
  typography: typographySizes,
  shadows: {
    ...shadows,
    // Adjust shadows for dark mode
    subtle: {
      ...shadows.subtle,
      shadowColor: '#000',
      shadowOpacity: 0.15,
    },
    low: {
      ...shadows.low,
      shadowColor: '#000',
      shadowOpacity: 0.2,
    },
    medium: {
      ...shadows.medium,
      shadowColor: '#000',
      shadowOpacity: 0.25,
    },
    high: {
      ...shadows.high,
      shadowColor: '#000',
      shadowOpacity: 0.3,
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get theme tokens for a given color scheme
export function getThemeTokens(colorScheme: 'light' | 'dark' | null | undefined) {
  if (colorScheme === 'dark') {
    return darkTheme;
  }
  return lightTheme;
}

// Default tokens (light theme as primary per design.json)
export const tokens = lightTheme;

// ============================================
// LEGACY EXPORTS (for backwards compatibility)
// ============================================

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
    sans: 'Nunito-Regular',
    sansSemiBold: 'Nunito-SemiBold',
    sansBold: 'Nunito-Bold',
    display: 'Caveat-SemiBold',
    displayMedium: 'Caveat-Medium',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  android: {
    sans: 'Nunito-Regular',
    sansSemiBold: 'Nunito-SemiBold',
    sansBold: 'Nunito-Bold',
    display: 'Caveat-SemiBold',
    displayMedium: 'Caveat-Medium',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
  default: {
    sans: 'Nunito-Regular',
    sansSemiBold: 'Nunito-SemiBold',
    sansBold: 'Nunito-Bold',
    display: 'Caveat-SemiBold',
    displayMedium: 'Caveat-Medium',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Nunito', 'DM Sans', system-ui, -apple-system, sans-serif",
    sansSemiBold: "'Nunito', 'DM Sans', system-ui, -apple-system, sans-serif",
    sansBold: "'Nunito', 'DM Sans', system-ui, -apple-system, sans-serif",
    display: "'Caveat', 'Kalam', cursive",
    displayMedium: "'Caveat', 'Kalam', cursive",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Nunito', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});

// ============================================
// DESIGN SYSTEM UTILITIES
// ============================================

// Card styles helper
export const cardStyle = {
  backgroundColor: surfaces.cardWhite,
  borderRadius: borderRadius.xl,
  padding: spacing.md,
  ...shadows.low,
};

// CTA Button styles helper
export const ctaButtonStyle = {
  backgroundColor: text.primary,
  borderRadius: borderRadius.full,
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing.xxl,
};

// Section header (handwritten) styles helper
export const sectionHeaderStyle = {
  ...typography.displayMedium,
  color: text.handwritten,
  marginBottom: spacing.lg,
};

// Get background color for specific screen types
export function getScreenBackground(
  screenType: 'home' | 'mood' | 'wellness' | 'health' | 'profile',
  colorScheme: 'light' | 'dark' | null | undefined
): string {
  const theme = getThemeTokens(colorScheme);
  
  switch (screenType) {
    case 'home':
      return theme.colors.background;
    case 'mood':
      return theme.colors.backgroundMood;
    case 'wellness':
      return theme.colors.backgroundWellness;
    case 'health':
      return theme.colors.backgroundHealth;
    case 'profile':
      return theme.colors.backgroundSecondary;
    default:
      return theme.colors.background;
  }
}

// Mood color helper
export function getMoodColor(mood: string): string {
  const moodMap: Record<string, string> = {
    joyful: moodColors.joyful,
    happy: moodColors.joyful,
    calm: moodColors.calm,
    peaceful: moodColors.calm,
    drained: moodColors.drained,
    tired: moodColors.drained,
    anxious: moodColors.anxious,
    stressed: moodColors.anxious,
    sad: moodColors.sad,
    low: moodColors.sad,
    energetic: moodColors.energetic,
    excited: moodColors.energetic,
  };
  
  return moodMap[mood.toLowerCase()] || accent.periwinkle;
}
