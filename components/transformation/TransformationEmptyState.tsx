/**
 * Empty state for transformation screens (design.json emptyState).
 * Title (Caveat) + description + optional action button.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { spacing, typography } from '@/constants/theme';
import TransformationCTAButton from './TransformationCTAButton';

export interface TransformationEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function TransformationEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  style,
}: TransformationEmptyStateProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.title,
          {
            color: tokens.colors.textHandwritten ?? tokens.colors.text,
            fontFamily: 'Caveat-SemiBold',
          },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.description, { color: tokens.colors.textMuted }]}>{description}</Text>
      {actionLabel != null && onAction != null && (
        <TransformationCTAButton label={actionLabel} onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.displaySmall.fontSize,
    lineHeight: typography.displaySmall.lineHeight,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyMedium,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.sm,
  },
});

export default TransformationEmptyState;
