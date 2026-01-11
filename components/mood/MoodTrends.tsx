/**
 * MoodTrends Component
 * 
 * Displays mood insights and trends with charts and statistics.
 * Matches the design.json aesthetic with soft colors and friendly visuals.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { 
  getThemeTokens, 
  getMoodColor,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { IconSymbol } from '@/components/ui/icon-symbol';

type JournalEntry = {
  id: string;
  entry_date: number;
  mood?: string | null;
  mood_intensity?: number | null;
  energy_level?: number | null;
  stress_level?: number | null;
  sleep_quality?: number | null;
};

type MoodTrendsProps = {
  entries: JournalEntry[];
  period?: 'week' | 'month';
};

export function MoodTrends({ entries, period = 'week' }: MoodTrendsProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  // Calculate insights
  const insights = useMemo(() => {
    const now = Date.now();
    const periodMs = period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const startDate = now - periodMs;
    
    const periodEntries = entries.filter(e => e.entry_date >= startDate);
    
    if (periodEntries.length === 0) {
      return null;
    }

    // Calculate averages
    const moodEntries = periodEntries.filter(e => e.mood_intensity);
    const stressEntries = periodEntries.filter(e => e.stress_level);
    const energyEntries = periodEntries.filter(e => e.energy_level);
    const sleepEntries = periodEntries.filter(e => e.sleep_quality);

    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + (e.mood_intensity || 0), 0) / moodEntries.length
      : null;

    const avgStress = stressEntries.length > 0
      ? stressEntries.reduce((sum, e) => sum + (e.stress_level || 0), 0) / stressEntries.length
      : null;

    const avgEnergy = energyEntries.length > 0
      ? energyEntries.reduce((sum, e) => sum + (e.energy_level || 0), 0) / energyEntries.length
      : null;

    const avgSleep = sleepEntries.length > 0
      ? sleepEntries.reduce((sum, e) => sum + (e.sleep_quality || 0), 0) / sleepEntries.length
      : null;

    // Count mood types
    const moodCounts: Record<string, number> = {};
    periodEntries.forEach(e => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
    });

    // Find most common mood
    const mostCommonMood = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0];

    // Calculate trend (comparing to previous period)
    const prevPeriodStart = startDate - periodMs;
    const prevEntries = entries.filter(e => e.entry_date >= prevPeriodStart && e.entry_date < startDate);
    const prevMoodAvg = prevEntries.length > 0
      ? prevEntries.reduce((sum, e) => sum + (e.mood_intensity || 0), 0) / prevEntries.filter(e => e.mood_intensity).length
      : null;

    let moodTrend: 'up' | 'down' | 'stable' = 'stable';
    if (avgMood && prevMoodAvg) {
      if (avgMood > prevMoodAvg + 0.5) moodTrend = 'up';
      else if (avgMood < prevMoodAvg - 0.5) moodTrend = 'down';
    }

    return {
      totalEntries: periodEntries.length,
      avgMood,
      avgStress,
      avgEnergy,
      avgSleep,
      mostCommonMood: mostCommonMood ? mostCommonMood[0] : null,
      moodTrend,
    };
  }, [entries, period]);

  // Generate bar chart data for last 7 days
  const chartData = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayEntry = entries.find(e => {
        const entryDate = new Date(e.entry_date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      });

      days.push({
        label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()],
        value: dayEntry?.mood_intensity || 0,
        hasData: !!dayEntry?.mood_intensity,
      });
    }
    
    return days;
  }, [entries]);

  if (!insights) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.card }, shadows.low]}>
        <View style={styles.emptyState}>
          <IconSymbol name="chart.bar" size={32} color={tokens.colors.textMuted} />
          <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
            Add more journal entries to see your mood trends
          </Text>
        </View>
      </View>
    );
  }

  const getTrendIcon = () => {
    switch (insights.moodTrend) {
      case 'up': return 'arrow.up.right';
      case 'down': return 'arrow.down.right';
      default: return 'arrow.right';
    }
  };

  const getTrendColor = () => {
    switch (insights.moodTrend) {
      case 'up': return tokens.colors.success;
      case 'down': return tokens.colors.coral;
      default: return tokens.colors.teal;
    }
  };

  const getTrendMessage = () => {
    if (!insights.avgMood) return '';
    
    if (insights.avgMood >= 7) return 'Your mood has been great! Keep it up! 🌟';
    if (insights.avgMood >= 5) return 'Steady progress. You\'re doing well! 💪';
    if (insights.avgMood >= 3) return 'Some ups and downs. That\'s okay! 🌱';
    return 'Tough times. Remember to be kind to yourself 💚';
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.card }, shadows.low]}>
      {/* Header */}
      <Text style={[styles.title, { color: tokens.colors.textHandwritten }]}>
        Insights
      </Text>

      {/* Trend Message */}
      <View style={[styles.messageCard, { backgroundColor: tokens.colors.primaryLight + '30' }]}>
        <IconSymbol name={getTrendIcon()} size={20} color={getTrendColor()} />
        <Text style={[styles.messageText, { color: tokens.colors.text }]}>
          {getTrendMessage()}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: tokens.colors.primary }]}>
            {insights.avgMood?.toFixed(1) || '—'}
          </Text>
          <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
            Avg Mood
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: tokens.colors.coral }]}>
            {insights.avgStress?.toFixed(1) || '—'}
          </Text>
          <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
            Avg Stress
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: tokens.colors.teal }]}>
            {insights.avgEnergy?.toFixed(1) || '—'}
          </Text>
          <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
            Avg Energy
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: tokens.colors.orchid }]}>
            {insights.avgSleep?.toFixed(1) || '—'}
          </Text>
          <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
            Avg Sleep
          </Text>
        </View>
      </View>

      {/* Mini Bar Chart */}
      <View style={styles.chartSection}>
        <Text style={[styles.chartTitle, { color: tokens.colors.textSecondary }]}>
          Mood this week
        </Text>
        <View style={styles.chartContainer}>
          {chartData.map((day, index) => (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    { 
                      backgroundColor: day.hasData ? tokens.colors.primary : tokens.colors.border,
                      height: `${Math.max(10, day.value * 10)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.chartLabel, { color: tokens.colors.textMuted }]}>
                {day.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Most Common Mood */}
      {insights.mostCommonMood && (
        <View style={styles.moodBadgeContainer}>
          <Text style={[styles.moodBadgeLabel, { color: tokens.colors.textMuted }]}>
            Most common mood:
          </Text>
          <View
            style={[
              styles.moodBadge,
              { backgroundColor: getMoodColor(insights.mostCommonMood) + '30' },
            ]}
          >
            <Text
              style={[
                styles.moodBadgeText,
                { color: getMoodColor(insights.mostCommonMood) },
              ]}
            >
              {insights.mostCommonMood}
            </Text>
          </View>
        </View>
      )}

      {/* Entry Count */}
      <Text style={[styles.entryCount, { color: tokens.colors.textMuted }]}>
        Based on {insights.totalEntries} {insights.totalEntries === 1 ? 'entry' : 'entries'} this {period}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Caveat-SemiBold',
    marginBottom: spacing.md,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Nunito-Medium',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    marginTop: spacing.xxs,
  },
  chartSection: {
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Medium',
    marginBottom: spacing.sm,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 60,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: '60%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-Medium',
    marginTop: spacing.xxs,
  },
  moodBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  moodBadgeLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  moodBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  moodBadgeText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    textTransform: 'capitalize',
  },
  entryCount: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
});

export default MoodTrends;
