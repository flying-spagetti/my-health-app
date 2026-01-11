/**
 * BigButton Component
 * 
 * Primary call-to-action button following design.json spec:
 * - Pill-shaped (full border radius)
 * - Dark background with white text
 * - Soft shadow
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { 
  getThemeTokens,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

interface BigButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export default function BigButton({ 
  title, 
  onPress, 
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
}: BigButtonProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: tokens.colors.primary };
      case 'outline':
        return { 
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: tokens.colors.buttonPrimary,
        };
      case 'primary':
      default:
        return { backgroundColor: tokens.colors.buttonPrimary };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return tokens.colors.buttonPrimary;
      default:
        return tokens.colors.buttonPrimaryText;
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        getButtonStyle(),
        shadows.medium,
        disabled && styles.buttonDisabled,
        style,
      ]} 
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text 
          style={[
            styles.text, 
            { color: getTextColor() },
            disabled && styles.textDisabled,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: { 
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
  },
  textDisabled: {
    opacity: 0.8,
  },
});
