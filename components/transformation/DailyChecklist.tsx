import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import Ionicons from '@expo/vector-icons/Ionicons';
import { borderRadius, spacing, shadows } from '@/constants/theme';

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  optional?: boolean;
};

type DailyChecklistProps = {
  title?: string;
  items: ChecklistItem[];
  onToggle: (id: string, done: boolean) => void;
  embedded?: boolean;
};

function ChecklistRow({
  item,
  tokens,
  onToggle,
}: {
  item: ChecklistItem;
  tokens: ReturnType<typeof getThemeTokens>;
  onToggle: (id: string, done: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const prevDone = React.useRef(item.done);
  useEffect(() => {
    if (item.done && !prevDone.current) {
      scale.value = withSequence(withSpring(1.2), withSpring(1));
      opacity.value = withSequence(withSpring(0.5), withSpring(1));
    }
    prevDone.current = item.done;
  }, [item.done]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(item.id, !item.done);
  };

  return (
    <TouchableOpacity
      style={[
        styles.item,
        {
          borderBottomColor: tokens.colors.border,
          backgroundColor: item.done ? tokens.colors.success + '15' : 'transparent',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.checkbox,
          {
            borderColor: item.done ? tokens.colors.success : tokens.colors.border,
            backgroundColor: item.done ? tokens.colors.success : 'transparent',
          },
          animatedStyle,
        ]}
      >
        {item.done && (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        )}
      </Animated.View>
      <Text
        style={[
          styles.label,
          {
            color: tokens.colors.text,
            textDecorationLine: item.done ? 'line-through' : 'none',
            opacity: item.done ? 0.7 : 1,
          },
        ]}
      >
        {item.label}
        {item.optional && (
          <Text style={[styles.optional, { color: tokens.colors.textMuted }]}> (optional)</Text>
        )}
      </Text>
    </TouchableOpacity>
  );
}

export default function DailyChecklist({ title = '', items, onToggle, embedded }: DailyChecklistProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  return (
    <View style={[styles.container, !embedded && { backgroundColor: tokens.colors.card }, !embedded && shadows.low, embedded && styles.embedded]}>
      {title ? <Text style={[styles.title, { color: tokens.colors.text }]}>{title}</Text> : null}
      {items.map((item) => (
        <ChecklistRow key={item.id} item={item} tokens={tokens} onToggle={onToggle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  embedded: {
    marginBottom: 0,
    padding: 0,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    flex: 1,
  },
  optional: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
