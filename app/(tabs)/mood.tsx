/**
 * Mood Tab - Journal/Mood Tracking with Calendar Visualization
 * 
 * Features:
 * - Mood calendar (monthly view with colored dots)
 * - Mood trends and insights
 * - Journal entries list
 * - Quick add button
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { useThemePreference } from '@/hooks/use-theme-preference';
import { 
  getThemeTokens, 
  getScreenBackground, 
  getMoodColor,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';
import { getJournalEntries } from '@/services/db';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MoodCalendar } from '@/components/mood/MoodCalendar';
import { MoodTrends } from '@/components/mood/MoodTrends';

type JournalEntry = {
  id: string;
  entry_date: number;
  mood?: string | null;
  mood_intensity?: number | null;
  energy_level?: number | null;
  stress_level?: number | null;
  sleep_quality?: number | null;
  note?: string | null;
};

export default function MoodScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const backgroundColor = getScreenBackground('mood', colorScheme);
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = async () => {
    try {
      const data = await getJournalEntries();
      setEntries(data as JournalEntry[]);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEntries();
  }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor }]} 
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.textHandwritten }]}>
            Mood & Journal
          </Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
            Track your emotional wellbeing
          </Text>
        </View>

        {/* Mood Calendar (Monthly View) */}
        <MoodCalendar 
          entries={entries}
          onDateSelect={(date) => {
            // Could navigate to specific day's entry
            console.log('Selected date:', date);
          }}
        />

        {/* Mood Trends & Insights */}
        <View style={styles.trendsContainer}>
          <MoodTrends entries={entries} period="week" />
        </View>

        {/* Recent Entries */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
            Recent Entries
          </Text>
          
          {isLoading ? (
            <View style={[styles.card, { backgroundColor: tokens.colors.card }, shadows.low]}>
              <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                Loading...
              </Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
              <IconSymbol name="book" size={48} color={tokens.colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>
                No entries yet
              </Text>
              <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                Start tracking your mood and wellness journey
              </Text>
            </View>
          ) : (
            entries.slice(0, 5).map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[styles.entryCard, { backgroundColor: tokens.colors.card }, shadows.low]}
                onPress={() => router.push(`/journal-detail?id=${entry.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryDate, { color: tokens.colors.text }]}>
                    {formatDate(entry.entry_date)}
                  </Text>
                  {entry.mood && (
                    <View
                      style={[
                        styles.moodBadge,
                        { backgroundColor: getMoodColor(entry.mood) + '30' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.moodText,
                          { color: getMoodColor(entry.mood) },
                        ]}
                      >
                        {entry.mood}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.entryMetrics}>
                  {entry.mood_intensity && (
                    <Text style={[styles.metricText, { color: tokens.colors.textSecondary }]}>
                      Mood: {entry.mood_intensity}/10
                    </Text>
                  )}
                  {entry.energy_level && (
                    <Text style={[styles.metricText, { color: tokens.colors.textSecondary }]}>
                      Energy: {entry.energy_level}/10
                    </Text>
                  )}
                  {entry.stress_level && (
                    <Text style={[styles.metricText, { color: tokens.colors.textSecondary }]}>
                      Stress: {entry.stress_level}/10
                    </Text>
                  )}
                </View>
                
                {entry.note && (
                  <Text
                    style={[styles.entryNote, { color: tokens.colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {entry.note}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: tokens.colors.buttonPrimary }, shadows.high]}
        onPress={() => router.push('/add-journal')}
        activeOpacity={0.8}
      >
        <Text style={[styles.fabText, { color: tokens.colors.buttonPrimaryText }]}>
          Add Entry
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Caveat-SemiBold',
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  trendsContainer: {
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Caveat-SemiBold',
    marginBottom: spacing.md,
  },
  entryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryDate: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
  moodBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  moodText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    textTransform: 'capitalize',
  },
  entryMetrics: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  metricText: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  entryNote: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    lineHeight: 20,
  },
  emptyCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-SemiBold',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  fabText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
});
