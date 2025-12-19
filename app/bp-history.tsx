import { tokens } from '@/constants/theme';
import { getBPReadings } from '@/services/db';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BPReading = {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number | null;
  measured_at: number;
  note?: string | null;
};

export default function BPHistoryScreen() {
  const [readings, setReadings] = useState<BPReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getBPReadings();
        setReadings(data as BPReading[]);
      } catch (error) {
        console.error('Error loading BP readings:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Blood Pressure History</Text>
          <Text style={styles.subtitle}>Your recent readings</Text>
        </View>

        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptySubtitle}>Loading your blood pressure history…</Text>
          </View>
        ) : readings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No readings yet</Text>
            <Text style={styles.emptySubtitle}>
              Add a blood pressure reading from the Today tab to see your history here.
            </Text>
          </View>
        ) : (
          readings.map((reading) => {
            const date = new Date(reading.measured_at);
            return (
              <View key={reading.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.bpValue}>
                    {reading.systolic}/{reading.diastolic} mmHg
                  </Text>
                  <Text style={styles.dateText}>
                    {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {typeof reading.pulse === 'number' && (
                  <Text style={styles.metaText}>Pulse {reading.pulse} bpm</Text>
                )}
                {reading.note ? (
                  <Text style={styles.noteText}>{reading.note}</Text>
                ) : null}
              </View>
            );
          })
        )}

        <Text style={styles.disclaimer}>
          This app does not provide medical advice. Always consult a healthcare professional about
          your blood pressure readings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bg,
  },
  content: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  header: {
    marginBottom: tokens.spacing.lg,
  },
  title: {
    fontSize: tokens.typography.h1,
    fontWeight: '700',
    color: tokens.colors.text,
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    fontSize: tokens.typography.body,
    color: tokens.colors.textMuted,
  },
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.sm,
  },
  bpValue: {
    fontSize: tokens.typography.h2,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  dateText: {
    fontSize: tokens.typography.small,
    color: tokens.colors.textMuted,
  },
  metaText: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.xs,
  },
  noteText: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
  },
  emptyState: {
    paddingVertical: tokens.spacing.xl,
    alignItems: 'center',
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
  disclaimer: {
    marginTop: tokens.spacing.xl,
    fontSize: tokens.typography.caption,
    color: tokens.colors.textMuted,
  },
});


