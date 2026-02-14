import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import Ionicons from '@expo/vector-icons/Ionicons';
import { borderRadius, spacing, shadows } from '@/constants/theme';

export type MealItem = {
  meal: string;
  items: string;
};

type MealPlanCardProps = {
  meals: MealItem[];
  macros?: { kcal: string; protein: string; fat: string; carbs: string };
  completed?: Record<string, boolean>;
  onToggleMeal?: (meal: string, completed: boolean) => void;
  onLogSwap?: () => void;
};

export default function MealPlanCard({
  meals,
  macros,
  completed = {},
  onToggleMeal,
  onLogSwap,
}: MealPlanCardProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const mealLabels: Record<string, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    'post-workout': 'Post-workout',
    dinner: 'Dinner',
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.card }, shadows.low]}>
      {macros && (
        <View style={[styles.macrosRow, { borderBottomColor: tokens.colors.border }]}>
          <Text style={[styles.macroLabel, { color: tokens.colors.textMuted }]}>
            {macros.kcal} kcal
          </Text>
          <Text style={[styles.macroLabel, { color: tokens.colors.textMuted }]}>
            P: {macros.protein}g
          </Text>
          <Text style={[styles.macroLabel, { color: tokens.colors.textMuted }]}>
            F: {macros.fat}g
          </Text>
          <Text style={[styles.macroLabel, { color: tokens.colors.textMuted }]}>
            C: {macros.carbs}g
          </Text>
        </View>
      )}
      {meals.map((m) => (
        <View
          key={m.meal}
          style={[
            styles.mealRow,
            {
              borderBottomColor: tokens.colors.border,
              backgroundColor: completed[m.meal] ? tokens.colors.success + '15' : 'transparent',
            },
          ]}
        >
          {onToggleMeal && (
            <TouchableOpacity
              style={[
                styles.checkbox,
                {
                  borderColor: completed[m.meal] ? tokens.colors.success : tokens.colors.border,
                  backgroundColor: completed[m.meal] ? tokens.colors.success : 'transparent',
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleMeal(m.meal, !completed[m.meal]);
              }}
            >
              {completed[m.meal] && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          )}
          <View style={styles.mealContent}>
            <Text style={[styles.mealType, { color: tokens.colors.text }]}>
              {mealLabels[m.meal] || m.meal}
            </Text>
            <Text
              style={[
                styles.mealItems,
                {
                  color: tokens.colors.textMuted,
                  textDecorationLine: completed[m.meal] ? 'line-through' : 'none',
                },
              ]}
            >
              {m.items}
            </Text>
          </View>
        </View>
      ))}
      {onLogSwap && (
        <TouchableOpacity
          style={[styles.swapButton, { borderTopColor: tokens.colors.border }]}
          onPress={onLogSwap}
        >
          <Ionicons name="swap-horizontal" size={18} color={tokens.colors.primary} />
          <Text style={[styles.swapText, { color: tokens.colors.primary }]}>Log swap</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  macroLabel: {
    fontSize: 13,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: spacing.sm,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealContent: {
    flex: 1,
  },
  mealType: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  mealItems: {
    fontSize: 14,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
  },
  swapText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
