import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { getMeditationLogs, getMeditationRoutineById } from '@/services/db';
import { getMeditationMinutesHistory, getTrackingStats } from '@/services/tracking';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MeditationTrackerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  
  const [routine, setRoutine] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
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
      const [rout, allSessions] = await Promise.all([
        getMeditationRoutineById(id),
        getMeditationLogs(),
      ]);
      
      setRoutine(rout);
      const routineSessions = allSessions.filter(s => s.routine_id === id);
      setSessions(routineSessions);
      
      const [statsData, historyData] = await Promise.all([
        getTrackingStats('meditation', id),
        getMeditationMinutesHistory(id, 30),
      ]);
      setStats(statsData);
      setHistory(historyData);
    } catch (error) {
      // Removed for production.error('Error loading meditation data:', error);
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

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalSessions = sessions.length;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!routine) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: tokens.colors.text }]}>Meditation routine not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text }]}>{routine.name}</Text>
          <Text style={[styles.target, { color: tokens.colors.textMuted }]}>
            Target: {routine.target_minutes} minutes/day
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
          <Text style={[styles.infoLabel, { color: tokens.colors.textMuted }]}>Started</Text>
          <Text style={[styles.infoValue, { color: tokens.colors.text }]}>
            {formatDate(routine.start_date || routine.created_at)}
          </Text>
        </View>

        {stats && (
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
                <Text style={[styles.statValue, { color: tokens.colors.text }]}>{stats.streak}</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Day Streak</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
                <Text style={[styles.statValue, { color: tokens.colors.text }]}>{totalSessions}</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Total Sessions</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
                <Text style={[styles.statValue, { color: tokens.colors.text }]}>{totalMinutes}</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Total Minutes</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
                <Text style={[styles.statValue, { color: tokens.colors.text }]}>{stats.adherence}%</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Adherence</Text>
              </View>
            </View>
          </View>
        )}

        {history.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>30-Day Minutes</Text>
            <View style={[styles.chartContainer, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
              {history.map((item, index) => {
                const maxMinutes = Math.max(...history.map(h => h.minutes), routine.target_minutes);
                const barHeight = maxMinutes > 0 ? (item.minutes / maxMinutes) * 100 : 0;
                return (
                  <View key={index} style={styles.chartBar}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${barHeight}%`,
                          backgroundColor: item.minutes >= routine.target_minutes ? tokens.colors.success : tokens.colors.primary,
                        },
                      ]}
                    />
                    {item.minutes > 0 && (
                      <Text style={[styles.barLabel, { color: tokens.colors.textMuted }]}>
                        {item.minutes}m
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {sessions.length > 0 && (
          <View style={styles.sessionsSection}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Recent Sessions</Text>
            {sessions.slice(0, 10).map((session) => (
              <View
                key={session.id}
                style={[styles.sessionCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
              >
                <View style={styles.sessionHeader}>
                  <Text style={[styles.sessionDate, { color: tokens.colors.text }]}>
                    {formatDateTime(session.session_date)}
                  </Text>
                  <Text style={[styles.sessionDuration, { color: tokens.colors.primary }]}>
                    {session.duration} min
                  </Text>
                </View>
                {session.meditation_type && (
                  <Text style={[styles.sessionType, { color: tokens.colors.textMuted }]}>
                    {session.meditation_type}
                  </Text>
                )}
                {session.note && (
                  <Text style={[styles.sessionNote, { color: tokens.colors.textMuted }]}>
                    {session.note}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {routine.notes && (
          <View style={[styles.notesCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
            <Text style={[styles.notesLabel, { color: tokens.colors.textMuted }]}>Notes</Text>
            <Text style={[styles.notesText, { color: tokens.colors.text }]}>{routine.notes}</Text>
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
  target: {
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
  statsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
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
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
  },
  chartBar: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 8,
    marginTop: 4,
  },
  sessionsSection: {
    marginTop: 24,
  },
  sessionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionType: {
    fontSize: 14,
    marginBottom: 4,
  },
  sessionNote: {
    fontSize: 14,
    lineHeight: 20,
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

