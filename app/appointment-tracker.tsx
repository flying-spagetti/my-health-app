import { getThemeTokens } from '@/constants/theme';
import { getAppointments, updateAppointment, createTrackingEvent } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function AppointmentTrackerScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const all = await getAppointments();
      setAppointments(all);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
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

  const handleMarkComplete = async (apt: any) => {
    try {
      await updateAppointment(apt.id, { is_completed: 1 });
      await createTrackingEvent({
        parent_type: 'appointment',
        parent_id: apt.id,
        event_type: 'done',
        event_date: Date.now(),
      });
      await loadData();
      Alert.alert('Success', 'Appointment marked as complete');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark appointment as complete');
      console.error('Error marking appointment complete:', error);
    }
  };

  const now = Date.now();
  const upcoming = appointments.filter(a => a.appointment_date >= now && !a.is_completed);
  const past = appointments.filter(a => a.appointment_date < now || a.is_completed);
  
  const upcomingCount = upcoming.length;
  const pastCount = past.length;
  const completedCount = appointments.filter(a => a.is_completed).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text }]}>Appointments</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: tokens.colors.primary }]}
            onPress={() => router.push('/add-appointment')}
          >
            <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
            <Text style={[styles.statValue, { color: tokens.colors.text }]}>{upcomingCount}</Text>
            <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Upcoming</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
            <Text style={[styles.statValue, { color: tokens.colors.text }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
            <Text style={[styles.statValue, { color: tokens.colors.text }]}>{pastCount}</Text>
            <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Total</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Upcoming</Text>
                {upcoming.map((apt) => (
                  <View
                    key={apt.id}
                    style={[styles.appointmentCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
                  >
                    <View style={styles.appointmentHeader}>
                      <View style={styles.appointmentInfo}>
                        <Text style={[styles.doctorName, { color: tokens.colors.text }]}>
                          {apt.doctor_name}
                        </Text>
                        {apt.specialty && (
                          <Text style={[styles.specialty, { color: tokens.colors.textMuted }]}>
                            {apt.specialty}
                          </Text>
                        )}
                        <Text style={[styles.appointmentDate, { color: tokens.colors.text }]}>
                          {formatDateTime(apt.appointment_date)}
                        </Text>
                        {apt.location && (
                          <Text style={[styles.location, { color: tokens.colors.textMuted }]}>
                            📍 {apt.location}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: tokens.colors.primary + '20' }]}>
                        <Text style={[styles.typeText, { color: tokens.colors.primary }]}>
                          {apt.appointment_type === 'followup' ? 'Follow-up' : 'Visit'}
                        </Text>
                      </View>
                    </View>
                    {apt.notes && (
                      <Text style={[styles.notes, { color: tokens.colors.textMuted }]}>
                        {apt.notes}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={[styles.completeButton, { backgroundColor: tokens.colors.success }]}
                      onPress={() => handleMarkComplete(apt)}
                    >
                      <Text style={[styles.completeButtonText, { color: '#FFFFFF' }]}>
                        Mark Complete
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {past.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Past</Text>
                {past.map((apt) => (
                  <View
                    key={apt.id}
                    style={[
                      styles.appointmentCard,
                      {
                        backgroundColor: tokens.colors.elevatedSurface,
                        borderColor: tokens.colors.border,
                        opacity: apt.is_completed ? 1 : 0.7,
                      },
                    ]}
                  >
                    <View style={styles.appointmentHeader}>
                      <View style={styles.appointmentInfo}>
                        <Text style={[styles.doctorName, { color: tokens.colors.text }]}>
                          {apt.doctor_name}
                        </Text>
                        {apt.specialty && (
                          <Text style={[styles.specialty, { color: tokens.colors.textMuted }]}>
                            {apt.specialty}
                          </Text>
                        )}
                        <Text style={[styles.appointmentDate, { color: tokens.colors.text }]}>
                          {formatDateTime(apt.appointment_date)}
                        </Text>
                        {apt.location && (
                          <Text style={[styles.location, { color: tokens.colors.textMuted }]}>
                            📍 {apt.location}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor: apt.is_completed
                              ? tokens.colors.success + '20'
                              : tokens.colors.border + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeText,
                            {
                              color: apt.is_completed ? tokens.colors.success : tokens.colors.textMuted,
                            },
                          ]}
                        >
                          {apt.is_completed ? 'Completed' : apt.appointment_type === 'followup' ? 'Follow-up' : 'Visit'}
                        </Text>
                      </View>
                    </View>
                    {apt.notes && (
                      <Text style={[styles.notes, { color: tokens.colors.textMuted }]}>
                        {apt.notes}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {appointments.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                  No appointments recorded yet
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: tokens.colors.primary }]}
                  onPress={() => router.push('/add-appointment')}
                >
                  <Text style={[styles.emptyButtonText, { color: '#FFFFFF' }]}>Add First Appointment</Text>
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
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  appointmentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  completeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
});

