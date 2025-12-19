import BigButton from '@/components/BigButton';
import { getThemeTokens, tokens } from '@/constants/theme';
import { getMedicationLogs } from '@/services/db';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/hooks/use-theme-preference';

type MedicationLog = {
  id: string;
  medication_name: string;
  dosage: string;
  note?: string | null;
  taken_at: number;
};

export default function MedsScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        setIsLoading(true);
        try {
          const data = await getMedicationLogs();
          setLogs(data as MedicationLog[]);
        } catch (error) {
          console.error('Error loading medication logs:', error);
        } finally {
          setIsLoading(false);
        }
      })();
    }, []),
  );

  const renderMedication = ({ item }: { item: MedicationLog }) => (
    <TouchableOpacity style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <Text style={styles.medicationName}>{item.medication_name}</Text>
        <Text style={styles.medicationTime}>
          {new Date(item.taken_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
      <Text style={styles.medicationDosage}>Dosage: {item.dosage}</Text>
      {item.note ? (
        <Text style={styles.medicationNote}>{item.note}</Text>
      ) : null}
      <Text style={styles.medicationDate}>
        {new Date(item.taken_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: tokens.colors.text }]}>Medications</Text>
        <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
          Track your medication intake
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptySubtitle, { color: tokens.colors.textMuted }]}>
            Loading your medication history…
          </Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>
            No medications logged yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: tokens.colors.textMuted }]}>
            Start tracking your medications to maintain a complete health record.
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderMedication}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Text style={[styles.disclaimer, { color: tokens.colors.textMuted }]}>
        This app is for tracking only and does not replace professional medical advice. Always take
        medications as prescribed.
      </Text>

      <View style={styles.footer}>
        <BigButton 
          title="Add Medication" 
          onPress={() => router.push('/add-medication')} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bg,
  },
  header: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
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
  listContent: {
    padding: tokens.spacing.lg,
    paddingTop: 0,
  },
  medicationCard: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  medicationName: {
    fontSize: tokens.typography.h2,
    fontWeight: '600',
    color: tokens.colors.text,
    flex: 1,
  },
  medicationTime: {
    fontSize: tokens.typography.body,
    color: tokens.colors.primary,
    fontWeight: '500',
  },
  medicationDosage: {
    fontSize: tokens.typography.body,
    color: tokens.colors.textMuted,
    marginBottom: tokens.spacing.xs,
  },
  medicationNote: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
    fontStyle: 'italic',
    marginBottom: tokens.spacing.xs,
  },
  medicationDate: {
    fontSize: tokens.typography.small,
    color: tokens.colors.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
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
    lineHeight: 22,
  },
  disclaimer: {
    paddingHorizontal: tokens.spacing.lg,
    fontSize: tokens.typography.caption,
    color: tokens.colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    padding: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
  },
});
