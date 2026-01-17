import { getThemeTokens } from '@/constants/theme';
import { getAppointments, updateAppointment, createTrackingEvent } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { useFocusEffect } from '@react-navigation/native';

export default function AppointmentTrackerScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentlyCompleted, setRecentlyCompleted] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const all = await getAppointments();
    setAppointments(all);
    setIsLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const now = Date.now();

  const labelForDate = (ts: number) => {
    const diffDays = Math.floor((ts - now) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    return 'Past';
  };

  const handleComplete = async (apt: any) => {
    setRecentlyCompleted(apt.id);

    await updateAppointment(apt.id, { is_completed: 1 });
    await createTrackingEvent({
      parent_type: 'appointment',
      parent_id: apt.id,
      event_type: 'done',
      event_date: Date.now(),
    });

    setTimeout(() => {
      setRecentlyCompleted(null);
      loadData();
    }, 600);
  };

  const upcoming = appointments.filter(a => a.appointment_date >= now && !a.is_completed);
  const past = appointments.filter(a => a.appointment_date < now || a.is_completed);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text }]}>Appointments</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: tokens.colors.primary }]}
            onPress={() => router.push('/add-appointment')}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* STATS (SUBTLE) */}
        <View style={styles.statsRow}>
          <Text style={[styles.statText, { color: tokens.colors.textMuted }]}>
            Upcoming: {upcoming.length}
          </Text>
          <Text style={[styles.statText, { color: tokens.colors.textMuted }]}>
            Completed: {appointments.filter(a => a.is_completed).length}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        ) : (
          <>
            {/* UPCOMING */}
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Next</Text>
                {upcoming.map(apt => (
                  <View
                    key={apt.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: tokens.colors.elevatedSurface,
                        borderColor: tokens.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={[styles.doctor, { color: tokens.colors.text }]}>
                          {apt.doctor_name}
                        </Text>
                        {apt.specialty && (
                          <Text style={[styles.meta, { color: tokens.colors.textMuted }]}>
                            {apt.specialty}
                          </Text>
                        )}
                      </View>

                      <Text style={[styles.when, { color: tokens.colors.primary }]}>
                        {labelForDate(apt.appointment_date)}
                      </Text>
                    </View>

                    <Text style={[styles.date, { color: tokens.colors.text }]}>
                      {new Date(apt.appointment_date).toLocaleString()}
                    </Text>

                    {apt.location && (
                      <Text style={[styles.meta, { color: tokens.colors.textMuted }]}>
                        📍 {apt.location}
                      </Text>
                    )}

                    <TouchableOpacity
                      style={[styles.completeButton, { backgroundColor: tokens.colors.success }]}
                      onPress={() => handleComplete(apt)}
                    >
                      <Text style={styles.completeText}>Mark done</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* PAST */}
            {past.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.textMuted }]}>Past</Text>
                {past.map(apt => (
                  <View
                    key={apt.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: tokens.colors.elevatedSurface,
                        borderColor: tokens.colors.border,
                        opacity: apt.is_completed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.doctor, { color: tokens.colors.text }]}>
                      {apt.doctor_name}
                    </Text>
                    <Text style={[styles.meta, { color: tokens.colors.textMuted }]}>
                      {new Date(apt.appointment_date).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {appointments.length === 0 && (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                  No appointments yet
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: tokens.colors.primary }]}
                  onPress={() => router.push('/add-appointment')}
                >
                  <Text style={styles.addButtonText}>Add first appointment</Text>
                </TouchableOpacity>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statText: {
    fontSize: 13,
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctor: {
    fontSize: 16,
    fontWeight: '600',
  },
  when: {
    fontSize: 13,
    fontWeight: '700',
  },
  date: {
    marginTop: 4,
    fontSize: 14,
  },
  meta: {
    fontSize: 13,
    marginTop: 4,
  },

  completeButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeText: {
    color: '#fff',
    fontWeight: '600',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
});
