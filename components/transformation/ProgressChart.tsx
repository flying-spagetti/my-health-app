import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Polyline, Rect } from 'react-native-svg';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

type DataPoint = { date: number; value: number; label?: string };

type ProgressChartProps = {
  data: DataPoint[];
  title?: string;
  valueLabel?: string;
  height?: number;
  chartWidth?: number;
  targetMin?: number;
  targetMax?: number;
  emptyMessage?: string;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ProgressChart({
  data,
  title,
  valueLabel,
  height = 180,
  chartWidth: chartWidthProp,
  targetMin,
  targetMax,
  emptyMessage = 'Log your first weigh-in to see trends',
}: ProgressChartProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const svgWidth = chartWidthProp ?? 320;

  if (data.length === 0) {
    return (
      <View style={[styles.container, { minHeight: height }]}>
        {title && (
          <Text style={[styles.title, { color: tokens.colors.text }]}>{title}</Text>
        )}
        <View style={[styles.empty, { backgroundColor: tokens.colors.elevatedSurface }]}>
          <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
            {emptyMessage}
          </Text>
        </View>
      </View>
    );
  }

  const padding = { top: 20, right: 24, bottom: 36, left: 44 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const allVals = [...values];
  if (targetMin != null) allVals.push(targetMin);
  if (targetMax != null) allVals.push(targetMax);
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;
  const yMin = minVal - range * 0.1;
  const yMax = maxVal + range * 0.1;
  const yRange = yMax - yMin;

  const toY = (v: number) =>
    padding.top + chartHeight - ((v - yMin) / yRange) * chartHeight;

  const pointsStr = data
    .map((d, i) => {
      const x = padding.left + (i / Math.max(1, data.length - 1)) * chartWidth;
      const y = toY(d.value);
      return `${x},${y}`;
    })
    .join(' ');

  const showTargetBand = targetMin != null && targetMax != null && targetMin < targetMax;
  const targetY1 = showTargetBand ? toY(targetMax) : 0;
  const targetY2 = showTargetBand ? toY(targetMin) : 0;

  return (
    <View style={[styles.container, { minHeight: height }]}>
      {title && (
        <Text style={[styles.title, { color: tokens.colors.text }]}>{title}</Text>
      )}
      <Svg width={svgWidth} height={height}>
        {showTargetBand && (
          <Rect
            x={padding.left}
            y={targetY1}
            width={chartWidth}
            height={Math.max(2, targetY2 - targetY1)}
            fill={tokens.colors.primary + '20'}
            rx={2}
          />
        )}
        <Polyline
          points={pointsStr}
          fill="none"
          stroke={tokens.colors.primary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = padding.left + (i / Math.max(1, data.length - 1)) * chartWidth;
          const y = toY(d.value);
          return (
            <Circle key={i} cx={x} cy={y} r={4} fill={tokens.colors.primary} />
          );
        })}
      </Svg>
      <View style={styles.xAxis}>
        {data.length > 0 && (
          <>
            <Text style={[styles.dateLabel, { color: tokens.colors.textMuted }]}>
              {formatDate(data[0].date)}
            </Text>
            <Text style={[styles.dateLabel, { color: tokens.colors.textMuted }]}>
              {formatDate(data[data.length - 1].date)}
            </Text>
          </>
        )}
      </View>
      <View style={styles.labels}>
        {data.length > 0 && (
          <Text style={[styles.valueLabel, { color: tokens.colors.textMuted }]}>
            {valueLabel || 'Value'}: {data[data.length - 1]?.value}
            {showTargetBand ? ` • Target: ${targetMin}–${targetMax}` : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  empty: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  dateLabel: {
    fontSize: 11,
  },
  labels: {
    marginTop: 4,
  },
  valueLabel: {
    fontSize: 12,
  },
});
