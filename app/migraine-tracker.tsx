import { getThemeTokens } from '@/constants/theme';
import { getMigraineReadings } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/hooks/use-theme-preference';

export default function MigraineTrackerScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  
  const [migraines, setMigraines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const all = await getMigraineReadings();
      
      const now = Date.now();
      let filtered = all;
      
      if (filter === 'week') {
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        filtered = all.filter(m => m.started_at >= weekAgo);
      } else if (filter === 'month') {
        const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
        filtered = all.filter(m => m.started_at >= monthAgo);
      } else if (filter === 'year') {
        const yearAgo = now - 365 * 24 * 60 * 60 * 1000;
        filtered = all.filter(m => m.started_at >= yearAgo);
      }
      
      setMigraines(filtered);
    } catch (error) {
      console.error('Error loading migraine data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return tokens.colors.success;
    if (severity <= 6) return tokens.colors.warning;
    return tokens.colors.danger;
  };

  const parseJson = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const totalCount = migraines.length;
  const avgSeverity = totalCount > 0
    ? Math.round(migraines.reduce((sum, m) => sum + m.severity, 0) / totalCount)
    : 0;

  // Group by month for chart
  const monthlyCounts = new Map<string, number>();
  migraines.forEach(m => {
    const date = new Date(m.started_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthlyCounts.set(key, (monthlyCounts.get(key) || 0) + 1);
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text }]}>Migraine Tracker</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: tokens.colors.primary }]}
            onPress={() => router.push('/add-migraine')}
          >
            <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>+ Add Episode</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          {(['all', 'week', 'month', 'year'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filter === f ? tokens.colors.primary : tokens.colors.elevatedSurface,
                  borderColor: filter === f ? tokens.colors.primary : tokens.colors.border,
                },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? '#FFFFFF' : tokens.colors.text },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.statsSection}>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
                <Text style={[styles.statValue, { color: tokens.colors.text }]}>{totalCount}</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Total Episodes</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
                <Text style={[styles.statValue, { color: tokens.colors.text }]}>{avgSeverity}</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Avg Severity</Text>
              </View>
            </View>

            {migraines.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                  No migraine episodes recorded yet
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: tokens.colors.primary }]}
                  onPress={() => router.push('/add-migraine')}
                >
                  <Text style={[styles.emptyButtonText, { color: '#FFFFFF' }]}>Add First Episode</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.listSection}>
                {migraines.map((migraine) => {
                  const triggers = parseJson(migraine.triggers || '[]');
                  const symptoms = parseJson(migraine.symptoms || '[]');
                  
                  return (
                    <View
                      key={migraine.id}
                      style={[styles.migraineCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
                    >
                      <View style={styles.migraineHeader}>
                        <View>
                          <Text style={[styles.migraineDate, { color: tokens.colors.text }]}>
                            {formatDateTime(migraine.started_at)}
                          </Text>
                          {migraine.ended_at && (
                            <Text style={[styles.migraineDuration, { color: tokens.colors.textMuted }]}>
                              Duration: {Math.round((migraine.ended_at - migraine.started_at) / (1000 * 60))} min
                            </Text>
                          )}
                        </View>
                        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(migraine.severity) + '20' }]}>
                          <Text style={[styles.severityText, { color: getSeverityColor(migraine.severity) }]}>
                            {migraine.severity}/10
                          </Text>
                        </View>
                      </View>
                      
                      {triggers.length > 0 && (
                        <View style={styles.tagsContainer}>
                          <Text style={[styles.tagsLabel, { color: tokens.colors.textMuted }]}>Triggers: </Text>
                          {triggers.map((trigger: string, idx: number) => (
                            <View key={idx} style={[styles.tag, { backgroundColor: tokens.colors.surface }]}>
                              <Text style={[styles.tagText, { color: tokens.colors.text }]}>{trigger}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {symptoms.length > 0 && (
                        <View style={styles.tagsContainer}>
                          <Text style={[styles.tagsLabel, { color: tokens.colors.textMuted }]}>Symptoms: </Text>
                          {symptoms.map((symptom: string, idx: number) => (
                            <View key={idx} style={[styles.tag, { backgroundColor: tokens.colors.surface }]}>
                              <Text style={[styles.tagText, { color: tokens.colors.text }]}>{symptom}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {migraine.note && (
                        <Text style={[styles.migraineNote, { color: tokens.colors.textMuted }]}>
                          {migraine.note}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listSection: {
    marginTop: 8,
  },
  migraineCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  migraineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  migraineDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  migraineDuration: {
    fontSize: 12,
    marginTop: 4,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
  },
  migraineNote: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
});

