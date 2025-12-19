import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

type FilterPeriod = 'week' | 'month' | 'year' | 'all';

interface ActivityFilterTabsProps {
  selected: FilterPeriod;
  onSelect: (period: FilterPeriod) => void;
}

export default function ActivityFilterTabs({ selected, onSelect }: ActivityFilterTabsProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const tabs: { label: string; value: FilterPeriod }[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
    { label: 'All time', value: 'all' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isSelected = selected === tab.value;
        return (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.tab,
              isSelected && { borderBottomColor: tokens.colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => onSelect(tab.value)}
          >
            <Text
              style={[
                styles.tabText,
                { color: isSelected ? tokens.colors.primary : tokens.colors.textMuted },
                isSelected && styles.tabTextSelected,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextSelected: {
    fontWeight: '700',
  },
});

