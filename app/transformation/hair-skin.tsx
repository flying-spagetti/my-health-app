import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeTokens, typography, borderRadius, spacing } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { SectionHeader } from '@/components/design/SectionHeader';
import { Card } from '@/components/design/Card';
import AdherenceRing from '@/components/transformation/AdherenceRing';
import HairlineCheckWarning from '@/components/transformation/HairlineCheckWarning';
import TransformationCTAButton from '@/components/transformation/TransformationCTAButton';
import {
  getRoutineChecklistByDate,
  getHairlineChecks,
  createHairlineCheck,
} from '@/services/db';
import { canLogHairlineCheck } from '@/services/transformation';
import { useTransformationLayout } from '@/hooks/use-transformation-layout';

function getStartOfDay(date: number = Date.now()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function HairSkinScreen() {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const { scrollContentStyle } = useTransformationLayout();

  const [hairlineStatus, setHairlineStatus] = useState<any>(null);
  const [recentChecks, setRecentChecks] = useState<any[]>([]);
  const [weeklyAdherence, setWeeklyAdherence] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    const [status, checks] = await Promise.all([
      canLogHairlineCheck(),
      getHairlineChecks(5),
    ]);
    setHairlineStatus(status);
    setRecentChecks(checks);

    const adherence: number[] = [];
    for (let i = 0; i < 7; i++) {
      const day = getStartOfDay(Date.now() - i * 24 * 60 * 60 * 1000);
      const cl = await getRoutineChecklistByDate(day);
      const items = [
        cl?.skin_am_done,
        cl?.skin_pm_done,
        cl?.sunscreen_done,
        cl?.retinol_done,
        cl?.hair_wash_done,
        cl?.conditioner_done,
        cl?.beard_oil_done,
      ].filter(Boolean).length;
      adherence.push(Math.round((items / 7) * 100));
    }
    setWeeklyAdherence(adherence.reverse());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleLogHairlineCheck = async () => {
    if (!hairlineStatus?.allowed) {
      Alert.alert('Too soon', hairlineStatus?.message || 'Wait 4-6 weeks between hairline checks.');
      return;
    }
    try {
      await createHairlineCheck({ check_date: Date.now(), notes: notes || null });
      setNotes('');
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Could not log hairline check');
    }
  };

  const avgAdherence =
    weeklyAdherence.length > 0
      ? Math.round(weeklyAdherence.reduce((a, b) => a + b, 0) / weeklyAdherence.length)
      : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />
        }
      >
        <SectionHeader title="Hair & skin" style={styles.screenSectionHeader} />

        <Card style={styles.ringCard}>
          <AdherenceRing value={avgAdherence} label="Routine adherence (7d)" />
        </Card>

        {hairlineStatus && (
          <HairlineCheckWarning
            allowed={hairlineStatus.allowed}
            daysSinceLast={hairlineStatus.daysSinceLast}
            message={hairlineStatus.message}
          />
        )}

        <Card style={styles.formCard}>
          <Text style={[styles.formTitle, { color: tokens.colors.text }]}>Log hairline check</Text>
          <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
            Recommended every 4–6 weeks. Same lighting & angles.
          </Text>
          <TextInput
            style={[styles.input, { color: tokens.colors.text, borderColor: tokens.colors.border, backgroundColor: tokens.colors.cardSecondary }]}
            placeholder="Notes (lighting, angles)"
            placeholderTextColor={tokens.colors.textMuted}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
          <TransformationCTAButton
            label="Log check"
            onPress={handleLogHairlineCheck}
            style={styles.button}
          />
        </Card>

        <SectionHeader title="Recent checks" style={styles.recentSectionHeader} />
        {recentChecks.map((c: any) => (
          <Card key={c.id} style={styles.checkCard}>
            <Text style={[styles.checkDate, { color: tokens.colors.text }]}>
              {new Date(c.check_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            {c.notes && (
              <Text style={[styles.checkNotes, { color: tokens.colors.textMuted }]}>{c.notes}</Text>
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {},
  screenSectionHeader: { marginBottom: spacing.lg },
  ringCard: { marginBottom: spacing.md, alignItems: 'center' },
  formCard: { marginBottom: spacing.lg },
  formTitle: { ...typography.headingMedium, marginBottom: 4 },
  hint: { ...typography.bodySmall, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.bodyLarge,
    marginBottom: spacing.sm,
    minHeight: 60,
  },
  button: { marginTop: spacing.xs },
  recentSectionHeader: { marginBottom: spacing.md },
  checkCard: { marginBottom: spacing.sm },
  checkDate: { ...typography.headingSmall },
  checkNotes: { ...typography.bodyMedium, marginTop: 4 },
});
