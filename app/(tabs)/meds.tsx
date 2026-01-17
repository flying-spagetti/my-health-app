import { getThemeTokens } from '@/constants/theme';
import { getMedications, getSupplements, getMeditationRoutines } from '@/services/db';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/hooks/use-theme-preference';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function TrackersScreen() {
  const router = useRouter();
  const [medications, setMedications] = useState<any[]>([]);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        setIsLoading(true);
        try {
          const [meds, supps, medRoutines] = await Promise.all([
            getMedications(true),
            getSupplements(true),
            getMeditationRoutines(true),
          ]);
          setMedications(meds);
          setSupplements(supps);
          setRoutines(medRoutines);
        } catch (error) {
          console.error('Error loading trackers:', error);
        } finally {
          setIsLoading(false);
        }
      })();
    }, []),
  );

  const TrackerCard = ({ title, count, onPress, icon }: { title: string; count: number; onPress: () => void; icon: string }) => (
    <TouchableOpacity
      style={[styles.trackerCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
      onPress={onPress}
    >
      <Text style={[styles.trackerIcon, { color: tokens.colors.primary }]}>{icon}</Text>
      <View style={styles.trackerInfo}>
        <Text style={[styles.trackerTitle, { color: tokens.colors.text }]}>{title}</Text>
        <Text style={[styles.trackerCount, { color: tokens.colors.textMuted }]}>
          {count} {count === 1 ? 'item' : 'items'}
        </Text>
      </View>
      <Text style={[styles.trackerArrow, { color: tokens.colors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text }]}>Trackers</Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
            Manage your health tracking
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Medications</Text>
              {medications.length > 0 ? (
                medications.map((med) => (
                  <TouchableOpacity
                    key={med.id}
                    style={[styles.itemCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
                    onPress={() => router.push(`/med-tracker?id=${med.id}`)}
                  >
                    <Text style={[styles.itemName, { color: tokens.colors.text }]}>{med.name}</Text>
                    <Text style={[styles.itemDosage, { color: tokens.colors.textMuted }]}>{med.dosage}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                  No medications added yet
                </Text>
              )}
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: tokens.colors.primary }]}
                onPress={() => router.push('/add-medication')}
              >
                <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>+ Add Medication</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Supplements</Text>
              {supplements.length > 0 ? (
                supplements.map((supp) => (
                  <TouchableOpacity
                    key={supp.id}
                    style={[styles.itemCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
                    onPress={() => router.push(`/supplement-tracker?id=${supp.id}`)}
                  >
                    <Text style={[styles.itemName, { color: tokens.colors.text }]}>{supp.name}</Text>
                    <Text style={[styles.itemDosage, { color: tokens.colors.textMuted }]}>{supp.dosage}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                  No supplements added yet
                </Text>
              )}
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: tokens.colors.primary }]}
                onPress={() => router.push('/add-supplement')}
              >
                <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>+ Add Supplement</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Meditation</Text>
              {routines.length > 0 ? (
                routines.map((routine) => (
                  <TouchableOpacity
                    key={routine.id}
                    style={[styles.itemCard, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
                    onPress={() => router.push(`/meditation-tracker?id=${routine.id}`)}
                  >
                    <Text style={[styles.itemName, { color: tokens.colors.text }]}>{routine.name}</Text>
                    <Text style={[styles.itemDosage, { color: tokens.colors.textMuted }]}>
                      Target: {routine.target_minutes} min/day
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                  No meditation routines added yet
                </Text>
              )}
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: tokens.colors.primary }]}
                onPress={() => router.push('/add-meditation')}
              >
                <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>+ Add Routine</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Other Trackers</Text>
              <TrackerCard
                title="Migraines"
                count={0}
                icon="⚡"
                onPress={() => router.push('/migraine-tracker')}
              />
              <TrackerCard
                title="Appointments"
                count={0}
                icon="📅"
                onPress={() => router.push('/appointment-tracker')}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  itemCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDosage: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  trackerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  trackerIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  trackerInfo: {
    flex: 1,
  },
  trackerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackerCount: {
    fontSize: 14,
  },
  trackerArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
});
