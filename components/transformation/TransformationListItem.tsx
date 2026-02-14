/**
 * List item row for transformation screens (practiceListItem-style).
 * Icon + title + subtitle + chevron; design.json alignment.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { spacing, typography } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';

export interface TransformationListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
  style?: ViewStyle;
}

export function TransformationListItem({
  title,
  subtitle,
  icon,
  onPress,
  showChevron = true,
  isLast = false,
  style,
}: TransformationListItemProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const content = (
    <>
      {icon != null && <View style={[styles.iconWrap, { backgroundColor: tokens.colors.primary + '20' }]}>{icon}</View>}
      <View style={styles.content}>
        <Text style={[styles.title, { color: tokens.colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle != null && (
          <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {showChevron && (
        <Feather name="chevron-right" size={20} color={tokens.colors.textMuted} style={styles.chevron} />
      )}
    </>
  );

  const containerStyle = [
    styles.row,
    !isLast && { borderBottomWidth: 1, borderBottomColor: tokens.colors.border },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyLarge,
    fontFamily: 'Nunito-SemiBold',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});

export default TransformationListItem;
