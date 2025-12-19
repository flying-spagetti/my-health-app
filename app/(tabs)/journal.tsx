import BigButton from '@/components/BigButton';
import { getThemeTokens, tokens } from '@/constants/theme';
import { getJournalEntries } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/hooks/use-theme-preference';

type JournalEntry = {
  id: string;
  entry_date: number;
  mood?: string | null;
  energy_level?: number | null;
  note: string;
  tags?: string | null;
};

export default function JournalScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  useEffect(() => {
    (async () => {
      try {
        const data = await getJournalEntries();
        setEntries(data as JournalEntry[]);
      } catch (error) {
        console.error('Error loading journal entries:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    const date = new Date(item.entry_date);
    const parsedTags: string[] = item.tags ? JSON.parse(item.tags) : [];

    return (
      <TouchableOpacity style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>
            {date.toLocaleDateString()}
          </Text>
          {item.mood ? <Text style={styles.entryMood}>{item.mood}</Text> : null}
        </View>
        <Text style={styles.entryNote} numberOfLines={3}>
          {item.note}
        </Text>
        {parsedTags.length > 0 && (
          <View style={styles.tagsContainer}>
            {parsedTags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
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
        <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>Track your daily thoughts and mood</Text>
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
            Start a simple daily check-in to see your mood and energy over time.
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  entryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  entryDate: {
    fontSize: tokens.typography.body,
    color: tokens.colors.textMuted,
  },
  entryMood: {
    fontSize: tokens.typography.body,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  entryNote: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
    lineHeight: 22,
    marginBottom: tokens.spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  tag: {
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.sm,
  },
  tagText: {
    fontSize: tokens.typography.small,
    color: tokens.colors.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  emptyTitle: {
    fontSize: tokens.typography.h2,
    fontWeight: '600',
    color: tokens.colors.text,
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: tokens.typography.body,
    color: tokens.colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    padding: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
  },
});
