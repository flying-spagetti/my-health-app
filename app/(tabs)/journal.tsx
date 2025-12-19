import BigButton from '@/components/BigButton';
import { getThemeTokens, tokens } from '@/constants/theme';
import { getJournalEntries } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { useFocusEffect } from '@react-navigation/native';

type JournalEntry = {
  id: string;
  entry_date: number;
  mood?: string | null;
  mood_intensity?: number | null;
  energy_level?: number | null;
  stress_level?: number | null;
  sleep_quality?: number | null;
  sleep_hours?: number | null;
  physical_symptoms?: string | null;
  social_activity?: string | null;
  exercise_duration?: number | null;
  exercise_type?: string | null;
  nutrition_quality?: number | null;
  hydration_glasses?: number | null;
  weather?: string | null;
  location?: string | null;
  gratitude?: string | null;
  goals_achieved?: string | null;
  challenges?: string | null;
  note?: string | null;
  tags?: string | null;
};

export default function JournalScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const loadEntries = async () => {
    try {
      const data = await getJournalEntries();
      setEntries(data as JournalEntry[]);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadEntries();
    }, [])
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderMetric = (label: string, value: string | number | null | undefined, color?: string) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <View style={styles.metric}>
        <Text style={[styles.metricLabel, { color: tokens.colors.textMuted }]}>{label}</Text>
        <Text style={[styles.metricValue, { color: color || tokens.colors.text }]}>{value}</Text>
      </View>
    );
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    const parsedTags: string[] = item.tags ? JSON.parse(item.tags) : [];
    const hasData = item.mood || item.energy_level || item.stress_level || item.sleep_quality || 
                    item.exercise_type || item.nutrition_quality || item.gratitude || item.note;

    return (
      <TouchableOpacity 
        style={[styles.entryCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
        onPress={() => router.push(`/journal-detail?id=${item.id}`)}
      >
        <View style={styles.entryHeader}>
          <View>
            <Text style={[styles.entryDate, { color: tokens.colors.text }]}>
              {formatDate(item.entry_date)}
            </Text>
            <Text style={[styles.entryTime, { color: tokens.colors.textMuted }]}>
              {formatTime(item.entry_date)}
            </Text>
          </View>
          {item.mood && (
            <View style={[styles.moodBadge, { backgroundColor: tokens.colors.primary + '20' }]}>
              <Text style={[styles.moodText, { color: tokens.colors.primary }]}>
                {item.mood}
                {item.mood_intensity && ` (${item.mood_intensity}/10)`}
              </Text>
            </View>
          )}
        </View>

        {hasData && (
          <View style={styles.metricsContainer}>
            {renderMetric('Energy', item.energy_level ? `${item.energy_level}/10` : null)}
            {renderMetric('Stress', item.stress_level ? `${item.stress_level}/10` : null)}
            {renderMetric('Sleep', item.sleep_quality ? `${item.sleep_quality}/10` : null)}
            {renderMetric('Hours', item.sleep_hours ? `${item.sleep_hours}h` : null)}
            {renderMetric('Exercise', item.exercise_type ? `${item.exercise_type}${item.exercise_duration ? ` (${item.exercise_duration}m)` : ''}` : null)}
            {renderMetric('Nutrition', item.nutrition_quality ? `${item.nutrition_quality}/10` : null)}
            {renderMetric('Water', item.hydration_glasses ? `${item.hydration_glasses} glasses` : null)}
            {renderMetric('Social', item.social_activity || null)}
            {renderMetric('Weather', item.weather || null)}
            {renderMetric('Location', item.location || null)}
          </View>
        )}

        {item.physical_symptoms && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: tokens.colors.textMuted }]}>Symptoms:</Text>
            <Text style={[styles.sectionText, { color: tokens.colors.text }]}>{item.physical_symptoms}</Text>
          </View>
        )}

        {item.gratitude && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: tokens.colors.textMuted }]}>Gratitude:</Text>
            <Text style={[styles.sectionText, { color: tokens.colors.text }]}>{item.gratitude}</Text>
          </View>
        )}

        {item.goals_achieved && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: tokens.colors.textMuted }]}>Achievements:</Text>
            <Text style={[styles.sectionText, { color: tokens.colors.text }]}>{item.goals_achieved}</Text>
          </View>
        )}

        {item.challenges && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: tokens.colors.textMuted }]}>Challenges:</Text>
            <Text style={[styles.sectionText, { color: tokens.colors.text }]}>{item.challenges}</Text>
          </View>
        )}

        {item.note && (
          <View style={styles.section}>
            <Text style={[styles.entryNote, { color: tokens.colors.text }]} numberOfLines={3}>
              {item.note}
            </Text>
          </View>
        )}

        {parsedTags.length > 0 && (
          <View style={styles.tagsContainer}>
            {parsedTags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: tokens.colors.surface }]}>
                <Text style={[styles.tagText, { color: tokens.colors.textMuted }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: tokens.colors.text }]}>Journal</Text>
        <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
          Comprehensive daily state tracking
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptySubtitle, { color: tokens.colors.textMuted }]}>Loading your entries…</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>
            No entries yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: tokens.colors.textMuted }]}>
            Start tracking your comprehensive daily state, mood, wellness metrics, and reflections.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <BigButton 
          title="Add Journal Entry" 
          onPress={() => router.push('/add-journal')} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 16,
  },
  entryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
  },
  moodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  entryNote: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingTop: 12,
  },
});
