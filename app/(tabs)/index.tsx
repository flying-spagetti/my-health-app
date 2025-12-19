import BigButton from '@/components/BigButton';
import RingProgress from '@/components/RingProgress';
import { getThemeTokens } from '@/constants/theme';
import { getTodaySummary } from '@/services/db';
import { getDueItemsToday, DueItem } from '@/services/tracking';
import { createTrackingEvent } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { useFocusEffect } from '@react-navigation/native';

type TodaySummary = {
  steps: number;
  bp?: { s: number; d: number };
};

export default function TodayScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<TodaySummary>({ steps: 0 });
  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const loadData = useCallback(async () => {
    try {
      const [s, items] = await Promise.all([
        getTodaySummary(),
        getDueItemsToday(),
      ]);
      setSummary(s);
      setDueItems(items);
    } catch (error) {
      console.error('Error loading today data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleMarkDone = async (item: DueItem) => {
    try {
      const eventType = item.type === 'medication' || item.type === 'supplement' ? 'taken' : 'done';
      await createTrackingEvent({
        parent_type: item.type,
        parent_id: item.id,
        schedule_id: item.scheduleId,
        event_type: eventType,
        event_date: Date.now(),
        event_time: Date.now(),
      });
      
      // Refresh the list
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark item as done. Please try again.');
      console.error('Error marking item done:', error);
    }
  };

  const groupItemsByCategory = (items: DueItem[]) => {
    const groups: Record<string, DueItem[]> = {
      medication: [],
      supplement: [],
      meditation: [],
      appointment: [],
    };
    
    items.forEach(item => {
      groups[item.type].push(item);
    });
    
    return groups;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return tokens.colors.success;
      case 'missed':
        return tokens.colors.danger;
      default:
        return tokens.colors.primary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'done':
        return 'Done';
      case 'missed':
        return 'Missed';
      default:
        return 'Pending';
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'medication':
        return 'Medications';
      case 'supplement':
        return 'Supplements';
      case 'meditation':
        return 'Meditation';
      case 'appointment':
        return 'Appointments';
      default:
        return category;
    }
  };

  const stepProgress = Math.min(100, Math.round((summary.steps / 8000) * 100));
  const groupedItems = groupItemsByCategory(dueItems);
  const hasItems = dueItems.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: tokens.colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />}
      >
        <Text style={[styles.title, { color: tokens.colors.text }]}>Today</Text>

        <View style={styles.row}>
          <RingProgress
            value={stepProgress}
            label={isLoading ? 'Loading…' : `${summary.steps} steps`}
          />
          <View style={styles.bpWrapper}>
            <View style={[styles.card, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
              <Text style={[styles.cardTitle, { color: tokens.colors.textMuted }]}>Blood Pressure</Text>
              {summary.bp ? (
                <Text style={[styles.big, { color: tokens.colors.text }]}>
                  {summary.bp.s}/{summary.bp.d} mmHg
                </Text>
              ) : (
                <Text style={[styles.muted, { color: tokens.colors.textMuted }]}>No reading yet</Text>
              )}
              <View style={styles.cardActions}>
                <TouchableOpacity style={[styles.linkButton, { backgroundColor: tokens.colors.surface }]} onPress={() => router.push('/add-bp')}>
                  <Text style={[styles.linkText, { color: tokens.colors.primary }]}>Add BP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: tokens.colors.surface }]}
                  onPress={() => router.push('/bp-history')}
                >
                  <Text style={[styles.linkText, { color: tokens.colors.primary }]}>History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {hasItems ? (
          <View style={styles.dueItemsSection}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Due Today</Text>
            
            {Object.entries(groupedItems).map(([category, items]) => {
              if (items.length === 0) return null;
              
              return (
                <View key={category} style={styles.categoryGroup}>
                  <Text style={[styles.categoryTitle, { color: tokens.colors.textMuted }]}>
                    {getCategoryTitle(category)}
                  </Text>
                  
                  {items.map((item) => (
                    <TouchableOpacity
                      key={`${item.id}-${item.scheduleId || ''}`}
                      style={[styles.dueItemCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
                      onPress={() => {
                        // Navigate to tracker page
                        if (item.type === 'medication') {
                          router.push(`/med-tracker?id=${item.id}`);
                        } else if (item.type === 'supplement') {
                          router.push(`/supplement-tracker?id=${item.id}`);
                        } else if (item.type === 'meditation') {
                          router.push(`/meditation-tracker?id=${item.id}`);
                        } else if (item.type === 'appointment') {
                          router.push(`/appointment-tracker?id=${item.id}`);
                        }
                      }}
                    >
                      <View style={styles.dueItemContent}>
                        <View style={styles.dueItemHeader}>
                          <Text style={[styles.dueItemName, { color: tokens.colors.text }]}>{item.name}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                              {getStatusText(item.status)}
                            </Text>
                          </View>
                        </View>
                        
                        {item.dosage && (
                          <Text style={[styles.dueItemDosage, { color: tokens.colors.textMuted }]}>
                            {item.dosage}
                          </Text>
                        )}
                        
                        {item.timeOfDay && (
                          <Text style={[styles.dueItemTime, { color: tokens.colors.textMuted }]}>
                            {item.timeOfDay}
                          </Text>
                        )}
                        
                        {(item.streak !== undefined || item.adherence !== undefined) && (
                          <View style={styles.statsRow}>
                            {item.streak !== undefined && item.streak > 0 && (
                              <Text style={[styles.statText, { color: tokens.colors.textMuted }]}>
                                🔥 {item.streak} day streak
                              </Text>
                            )}
                            {item.adherence !== undefined && (
                              <Text style={[styles.statText, { color: tokens.colors.textMuted }]}>
                                {item.adherence}% adherence
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                      
                      {item.status !== 'done' && (
                        <TouchableOpacity
                          style={[styles.markDoneButton, { backgroundColor: tokens.colors.primary }]}
                          onPress={() => handleMarkDone(item)}
                        >
                          <Text style={[styles.markDoneText, { color: '#FFFFFF' }]}>
                            {item.type === 'medication' || item.type === 'supplement' ? 'Mark Taken' : 'Mark Done'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>Nothing due today</Text>
            <Text style={[styles.emptySubtitle, { color: tokens.colors.textMuted }]}>
              Add medications, supplements, or meditation routines to start tracking
            </Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: tokens.colors.primary }]}
                onPress={() => router.push('/add-medication')}
              >
                <Text style={[styles.emptyButtonText, { color: '#FFFFFF' }]}>Add Medication</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
                onPress={() => router.push('/add-appointment')}
              >
                <Text style={[styles.emptyButtonText, { color: tokens.colors.text }]}>Add Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={[styles.quickCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
              onPress={() => router.push('/add-migraine')}
            >
              <Text style={[styles.quickTitle, { color: tokens.colors.text }]}>Migraine</Text>
              <Text style={[styles.quickSubtitle, { color: tokens.colors.textMuted }]}>Record episode</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
              onPress={() => router.push('/add-journal')}
            >
              <Text style={[styles.quickTitle, { color: tokens.colors.text }]}>Journal</Text>
              <Text style={[styles.quickSubtitle, { color: tokens.colors.textMuted }]}>Capture thoughts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  bpWrapper: {
    flex: 1,
    marginLeft: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  big: {
    fontSize: 24,
    fontWeight: '600',
  },
  muted: {
    fontSize: 14,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  linkButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dueItemsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryGroup: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dueItemCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  dueItemContent: {
    flex: 1,
  },
  dueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dueItemName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dueItemDosage: {
    fontSize: 14,
    marginBottom: 4,
  },
  dueItemTime: {
    fontSize: 14,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statText: {
    fontSize: 12,
  },
  markDoneButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  markDoneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsSection: {
    marginTop: 24,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickCard: {
    flexBasis: '48%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickSubtitle: {
    fontSize: 14,
  },
});
