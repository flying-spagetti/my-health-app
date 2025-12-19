import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

interface ActivityCardProps {
  title: string;
  value: string;
  icon: string;
  iconColor?: string;
  subtitle?: string;
  onPress?: () => void;
}

export default function ActivityCard({
  title,
  value,
  icon,
  iconColor = '#3B82F6',
  subtitle,
  onPress,
}: ActivityCardProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const CardContent = (
    <View style={[styles.container, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: tokens.colors.textMuted }]}>{title}</Text>
      </View>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <IconSymbol name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.value, { color: tokens.colors.text }]}>{value}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>{subtitle}</Text>
          )}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{CardContent}</TouchableOpacity>;
  }

  return CardContent;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
});

