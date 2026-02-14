/**
 * Primary CTA button for transformation screens (design.json ctaButton).
 * Pill-shaped, dark background, white text.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { borderRadius, spacing, typography } from '@/constants/theme';

export interface TransformationCTAButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function TransformationCTAButton({
  label,
  onPress,
  disabled = false,
  fullWidth = true,
  style,
}: TransformationCTAButtonProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? tokens.colors.textMuted : tokens.colors.buttonPrimary ?? tokens.colors.text,
          opacity: disabled ? 0.6 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, { color: tokens.colors.buttonPrimaryText ?? tokens.colors.textOnDark }]}>
        {label}
      </Text>
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
  },
  label: {
    ...typography.label,
    fontSize: 14,
  },
});

export default TransformationCTAButton;
