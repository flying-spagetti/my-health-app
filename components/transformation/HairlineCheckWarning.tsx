import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import Ionicons from '@expo/vector-icons/Ionicons';
import { borderRadius, spacing } from '@/constants/theme';

type HairlineCheckWarningProps = {
  allowed: boolean;
  daysSinceLast: number | null;
  message: string;
};

export default function HairlineCheckWarning({
  allowed,
  daysSinceLast,
  message,
}: HairlineCheckWarningProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  if (!message) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: allowed
            ? tokens.colors.info + '20'
            : tokens.colors.warning + '20',
          borderColor: allowed
            ? tokens.colors.info + '60'
            : tokens.colors.warning + '60',
        },
      ]}
    >
      <Ionicons
        name={allowed ? 'information-circle' : 'warning'}
        size={24}
        color={allowed ? tokens.colors.info : tokens.colors.warning}
        style={styles.icon}
      />
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: tokens.colors.text },
          ]}
        >
          {allowed ? 'Hairline check window' : 'Too soon for hairline check'}
        </Text>
        <Text style={[styles.message, { color: tokens.colors.textMuted }]}>
          {message}
        </Text>
        {daysSinceLast != null && (
          <Text style={[styles.days, { color: tokens.colors.textMuted }]}>
            Recommended: every 4–6 weeks (28–42 days)
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  icon: {
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  days: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
