/**
 * SectionHeader Component
 * 
 * Handwritten script section titles following design.json spec:
 * - Caveat font family
 * - Display size
 * - Handwritten color
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { 
  getThemeTokens,
  spacing,
} from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

export function SectionHeader({ 
  title,
  subtitle,
  actionText,
  onActionPress,
  style,
  size = 'medium',
}: SectionHeaderProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const getFontSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 28;
      default: return 24;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text 
          style={[
            styles.title, 
            { 
              color: tokens.colors.textHandwritten,
              fontSize: getFontSize(),
            },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {actionText && onActionPress && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onActionPress}
        >
          <Text style={[styles.actionText, { color: tokens.colors.primary }]}>
            {actionText}
          </Text>
          <IconSymbol name="chevron.right" size={14} color={tokens.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Caveat-SemiBold',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    marginTop: spacing.xxs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
});

export default SectionHeader;
