import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

type StepsStepperProps = {
  value: number;
  onChange: (value: number) => void;
  goal?: number;
  step?: number;
};

export default function StepsStepper({
  value,
  onChange,
  goal = 10000,
  step = 500,
}: StepsStepperProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const handleMinus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.max(0, value - step));
  };

  const handlePlus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(value + step);
  };

  const pct = Math.min(100, (value / goal) * 100);
  const toGo = Math.max(0, goal - value);

  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: tokens.colors.border + '40', borderColor: tokens.colors.border }]}
          onPress={handleMinus}
        >
          <Ionicons name="remove" size={24} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.value, { color: tokens.colors.text }]}>{value.toLocaleString()}</Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: tokens.colors.primary + '30', borderColor: tokens.colors.primary }]}
          onPress={handlePlus}
        >
          <Ionicons name="add" size={24} color={tokens.colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={[styles.progressBg, { backgroundColor: tokens.colors.border + '40' }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%`,
              backgroundColor: pct >= 100 ? tokens.colors.success : tokens.colors.primary,
            },
          ]}
        />
      </View>
      <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
        {pct >= 100 ? 'Goal reached!' : `${toGo.toLocaleString()} to go`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.sm },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'center',
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  hint: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
