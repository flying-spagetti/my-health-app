import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

interface ActivityBarChartProps {
  data: { day: string; value: number }[];
  period: 'week' | 'month' | 'year' | 'all';
}

export default function ActivityBarChart({ data, period }: ActivityBarChartProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const screenWidth = Dimensions.get('window').width;

  // Prepare chart data
  const chartData = {
    labels: data.map((d) => d.day),
    datasets: [
      {
        data: data.map((d) => d.value),
      },
    ],
  };

  // Calculate max value for y-axis
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const chartConfig = {
    backgroundColor: tokens.colors.background,
    backgroundGradientFrom: tokens.colors.background,
    backgroundGradientTo: tokens.colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // blue-500
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // gray-500
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: tokens.colors.border,
      strokeWidth: 1,
    },
    barPercentage: 0.6,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.periodText, { color: tokens.colors.textMuted }]}>
          {period === 'week' ? 'This week' : period === 'month' ? 'This month' : period === 'year' ? 'This year' : 'All time'}
        </Text>
        {period === 'week' && (
          <Text style={[styles.lastWeekText, { color: tokens.colors.textMuted }]}>
            {calculateLastPeriodTotal(data)}
          </Text>
        )}
      </View>
      
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={screenWidth - 48}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          showValuesOnTopOfBars={true}
          fromZero={true}
          style={styles.chart}
        />
        <View style={styles.yAxisLabel}>
          <Text style={[styles.yAxisText, { color: tokens.colors.textMuted }]}>min</Text>
        </View>
      </View>
      
      <View style={styles.bestActivityLabel}>
        <Text style={[styles.bestActivityText, { color: tokens.colors.textMuted }]}>BEST ACTIVITY</Text>
      </View>
    </View>
  );
}

function calculateLastPeriodTotal(data: { day: string; value: number }[]): string {
  // This is a placeholder - in a real app, you'd calculate from last period's data
  // For now, calculate a mock "last week" total
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const mockLastWeek = Math.floor(total * 0.8); // 80% of current week as mock
  const hours = Math.floor(mockLastWeek / 60);
  const minutes = mockLastWeek % 60;
  return hours > 0 ? `Last week ${hours}h ${minutes}m` : `Last week ${minutes}m`;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastWeekText: {
    fontSize: 14,
  },
  chartContainer: {
    position: 'relative',
    marginLeft: -24,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  yAxisLabel: {
    position: 'absolute',
    left: 8,
    top: 20,
  },
  yAxisText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bestActivityLabel: {
    alignItems: 'flex-end',
    marginTop: -40,
    marginRight: 8,
  },
  bestActivityText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

