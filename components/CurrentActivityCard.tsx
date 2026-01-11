import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

interface CurrentActivityCardProps {
  activityName: string;
  icon: string;
  timeRange: string;
  calories?: number;
  distance?: string;
}

export default function CurrentActivityCard({
  activityName,
  icon,
  timeRange,
  calories,
  distance,
}: CurrentActivityCardProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  return (
    <View style={[styles.container, { backgroundColor: '#6B46C1' }]}>
      <View style={styles.header}>
        <View style={styles.activityInfo}>
          <IconSymbol name={icon} size={24} color="#FFFFFF" />
          <Text style={styles.activityName}>{activityName}</Text>
        </View>
        <Text style={styles.timeRange}>{timeRange}</Text>
      </View>
      
      <View style={styles.metrics}>
        {calories && (
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{calories}</Text>
            <Text style={styles.metricLabel}>kCal</Text>
          </View>
        )}
        {distance && (
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{distance}</Text>
            <Text style={styles.metricLabel}>km</Text>
          </View>
        )}
      </View>
      
      {/* Mini bar graph visualization */}
      <View style={styles.barGraph}>
        {[0.3, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5].map((height, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: `${height * 100}%`,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeRange: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  metrics: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  barGraph: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    minHeight: 8,
  },
});


