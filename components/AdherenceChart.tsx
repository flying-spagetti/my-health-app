// components/AdherenceChart.tsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

type AdherenceChartProps = {
  data: Array<{ date: number; value: number }>;
  height?: number;
};

export default function AdherenceChart({ data, height = 120 }: AdherenceChartProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.max(2, (100 / data.length) - 1);
  
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40);
          return (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  width: `${barWidth}%`,
                  height: barHeight,
                  backgroundColor: item.value > 0 ? tokens.colors.success : tokens.colors.border,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: tokens.colors.textMuted }]}>
          {data.length} days
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '80%',
    gap: 1,
  },
  bar: {
    borderRadius: 2,
  },
  labels: {
    marginTop: 8,
  },
  label: {
    fontSize: 12,
  },
});

