import AdherenceChart from '@/components/AdherenceChart';
import { getThemeTokens } from '@/constants/theme';
import { getSupplementById, getDoseSchedulesByParent } from '@/services/db';
import { getTrackingStats, getHistoryAggregates } from '@/services/tracking';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/hooks/use-theme-preference';

export default function SupplementTrackerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  
  const [supplement, setSupplement] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const [supp, scheds] = await Promise.all([
        getSupplementById(id),
        getDoseSchedulesByParent('supplement', id),
      ]);
      
      setSupplement(supp);
      setSchedules(scheds);
      
      if (scheds.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(scheds[0].id);
      }
      
      if (selectedScheduleId || scheds.length > 0) {
        const scheduleId = selectedScheduleId || scheds[0].id;
        const [statsData, historyData] = await Promise.all([
          getTrackingStats('supplement', id, scheduleId),
          getHistoryAggregates('supplement', id, 30, scheduleId),
        ]);
        setStats(statsData);
        setHistory(historyData);
      }
    } catch (error) {
      console.error('Error loading supplement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getDaysOfWeekNames = (daysOfWeek: string) => {
    try {
      const days = JSON.parse(daysOfWeek) as number[];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map(d => dayNames[d]).join(', ');
    } catch {
      return 'Every day';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!supplement) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: tokens.colors.text }]}>Supplement not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text }]}>{supplement.name}</Text>
          <Text style={[styles.dosage, { color: tokens.colors.textMuted }]}>{supplement.dosage}</Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
          <Text style={[styles.infoLabel, { color: tokens.colors.textMuted }]}>Started</Text>
          <Text style={[styles.infoValue, { color: tokens.colors.text }]}>
            {formatDate(supplement.start_date || supplement.created_at)}
          </Text>
        </View>

        {schedules.length > 0 && (
          <View style={styles.schedulesSection}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Schedule</Text>
            {schedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={[
                  styles.scheduleCard,
                  {
                    backgroundColor: selectedScheduleId === schedule.id ? tokens.colors.primary + '20' : tokens.colors.elevatedSurface,
                    borderColor: selectedScheduleId === schedule.id ? tokens.colors.primary : tokens.colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedScheduleId(schedule.id);
                  loadData();
                }}
              >
                <View style={styles.scheduleHeader}>
                  <Text style={[styles.scheduleTime, { color: tokens.colors.text }]}>
                    {formatTime(schedule.time_of_day)}
                  </Text>
                  {schedule.dosage && (
                    <Text style={[styles.scheduleDosage, { color: tokens.colors.textMuted }]}>
                      {schedule.dosage}
                    </Text>
                  )}
                </View>
                <Text style={[styles.scheduleDays, { color: tokens.colors.textMuted }]}>
                  {getDaysOfWeekNames(schedule.days_of_week)}
                </Text>
                {schedule.instructions && (
                  <Text style={[styles.scheduleInstructions, { color: tokens.colors.textMuted }]}>
                    {schedule.instructions}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {stats && (
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
                <Text style={[styles.statValue, { color: tokens.colors.text }]}>{stats.streak}</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Day Streak</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
                <Text style={[styles.statValue, { color: tokens.colors.text }]}>{stats.adherence}%</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Adherence</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
                <Text style={[styles.statValue, { color: tokens.colors.text }]}>{stats.daysSinceStarted}</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Days Since Start</Text>
              </View>
              {stats.daysSinceLastDone !== null && (
                <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
                  <Text style={[styles.statValue, { color: tokens.colors.text }]}>{stats.daysSinceLastDone}</Text>
                  <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Days Since Last</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {history.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>30-Day Adherence</Text>
            <AdherenceChart data={history} />
          </View>
        )}

        {supplement.notes && (
          <View style={[styles.notesCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
            <Text style={[styles.notesLabel, { color: tokens.colors.textMuted }]}>Notes</Text>
            <Text style={[styles.notesText, { color: tokens.colors.text }]}>{supplement.notes}</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  dosage: {
    fontSize: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  schedulesSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  scheduleCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleTime: {
    fontSize: 18,
    fontWeight: '600',
  },
  scheduleDosage: {
    fontSize: 14,
  },
  scheduleDays: {
    fontSize: 14,
    marginBottom: 4,
  },
  scheduleInstructions: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  statsSection: {
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexBasis: '48%',
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
  chartSection: {
    marginTop: 24,
  },
  notesCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
  },
  notesLabel: {
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

