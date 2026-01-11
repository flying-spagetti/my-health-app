/**
 * Card Component
 * 
 * Soft, floating content container following design.json spec:
 * - White background
 * - 20px border radius
 * - Soft shadow
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { 
  getThemeTokens,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'highlighted';
  style?: ViewStyle;
  padding?: keyof typeof spacing;
}

export function Card({ 
  children, 
  variant = 'default',
  style,
  padding = 'md',
}: CardProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const getBackgroundColor = () => {
    switch (variant) {
      case 'subtle':
        return tokens.colors.cardSecondary;
      case 'highlighted':
        return tokens.colors.primaryLight + '20';
      default:
        return tokens.colors.card;
    }
  };

  return (
    <View 
      style={[
        styles.card,
        { 
          backgroundColor: getBackgroundColor(),
          padding: spacing[padding],
        },
        shadows.low,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
  },
});

export default Card;
