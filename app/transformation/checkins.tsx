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
import Ionicons from '@expo/vector-icons/Ionicons';
import { getThemeTokens, typography, borderRadius, spacing } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { SectionHeader } from '@/components/design/SectionHeader';
import { Card } from '@/components/design/Card';
import ProgressChart from '@/components/transformation/ProgressChart';
import TransformationCTAButton from '@/components/transformation/TransformationCTAButton';
import {
  getWeeklyCheckins,
  createWeeklyCheckin,
  getTransformationGoals,
} from '@/services/db';
import { checkWeightPlateau } from '@/services/transformation';
import { useTransformationLayout } from '@/hooks/use-transformation-layout';

function getStartOfDay(date: number = Date.now()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function CheckinsScreen() {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const { scrollContentStyle, chartWidth } = useTransformationLayout();

  const [checkins, setCheckins] = useState<any[]>([]);
  const [plateau, setPlateau] = useState<any>(null);
  const [goals, setGoals] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [quickWeight, setQuickWeight] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [c, p, g] = await Promise.all([
      getWeeklyCheckins(12),
      checkWeightPlateau(),
      getTransformationGoals(),
    ]);
    setCheckins(c);
    setPlateau(p);
    setGoals(g);
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

  const lastCheckin = checkins.find((c) => c.weight_kg != null);
  const lastWeightStr = lastCheckin
    ? `${lastCheckin.weight_kg} kg (${new Date(lastCheckin.checkin_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})`
    : null;

  const handleQuickSave = async () => {
    const w = parseFloat(quickWeight);
    if (isNaN(w) || w <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }
    setSaving(true);
    try {
      const today = new Date();
      today.setHours(7, 0, 0, 0);
      await createWeeklyCheckin({
        checkin_date: today.getTime(),
        weight_kg: w,
        waist_cm: null,
        notes: null,
      });
      setQuickWeight('');
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Could not save weigh-in');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }
    setSaving(true);
    try {
      const today = new Date();
      today.setHours(7, 0, 0, 0);
      await createWeeklyCheckin({
        checkin_date: today.getTime(),
        weight_kg: w,
        waist_cm: waist ? parseFloat(waist) : null,
        notes: notes || null,
      });
      setWeight('');
      setWaist('');
      setNotes('');
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Could not save check-in');
    } finally {
      setSaving(false);
    }
  };

  const weightData = checkins
    .filter((c) => c.weight_kg != null)
    .map((c) => ({
      date: c.checkin_date,
      value: c.weight_kg,
      label: new Date(c.checkin_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
    .reverse();

  const isSunday = new Date().getDay() === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />
        }
      >
        <SectionHeader title="Weekly check-ins" style={styles.screenSectionHeader} />

        <Card style={styles.quickCard}>
          {isSunday && (
            <View style={[styles.sundayBadge, { backgroundColor: tokens.colors.primary + '25' }]}>
              <Ionicons name="calendar" size={16} color={tokens.colors.primary} />
              <Text style={[styles.sundayBadgeText, { color: tokens.colors.primary }]}>Weigh-in day</Text>
            </View>
          )}
          <Text style={[styles.quickTitle, { color: tokens.colors.text }]}>Quick weigh-in</Text>
          {lastWeightStr && (
            <Text style={[styles.lastWeight, { color: tokens.colors.textMuted }]}>Last: {lastWeightStr}</Text>
          )}
          <View style={styles.quickRow}>
            <TextInput
              style={[styles.quickInput, { color: tokens.colors.text, borderColor: tokens.colors.border, backgroundColor: tokens.colors.cardSecondary }]}
              placeholder="Weight (kg)"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="decimal-pad"
              value={quickWeight}
              onChangeText={setQuickWeight}
            />
            <View style={styles.quickSaveBtnWrap}>
              <TransformationCTAButton
                label={saving ? '...' : 'Save'}
                onPress={handleQuickSave}
                disabled={saving}
              />
            </View>
          </View>
        </Card>

        <Card style={styles.chartCard}>
          <ProgressChart
            data={weightData}
            title="Weight trend"
            valueLabel="kg"
            chartWidth={chartWidth}
            targetMin={goals?.target_weight_min}
            targetMax={goals?.target_weight_max}
            emptyMessage="Log your first weigh-in to start tracking"
          />
        </Card>

        {plateau?.isPlateau && plateau?.suggestion && (
          <Card variant="highlighted" style={[styles.alertCard, { borderColor: tokens.colors.warning + '60' }]}>
            <Text style={[styles.alertTitle, { color: tokens.colors.text }]}>Plateau detected</Text>
            <Text style={[styles.alertText, { color: tokens.colors.textMuted }]}>
              {plateau.suggestion}
            </Text>
          </Card>
        )}

        <Card style={styles.formCard}>
          <Text style={[styles.formTitle, { color: tokens.colors.text }]}>
            Full check-in {!isSunday && '(Sunday recommended)'}
          </Text>
          <TextInput
            style={[styles.input, { color: tokens.colors.text, borderColor: tokens.colors.border, backgroundColor: tokens.colors.cardSecondary }]}
            placeholder="Weight (kg)"
            placeholderTextColor={tokens.colors.textMuted}
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
          />
          <TextInput
            style={[styles.input, { color: tokens.colors.text, borderColor: tokens.colors.border, backgroundColor: tokens.colors.cardSecondary }]}
            placeholder="Waist (cm) - optional"
            placeholderTextColor={tokens.colors.textMuted}
            keyboardType="decimal-pad"
            value={waist}
            onChangeText={setWaist}
          />
          <TextInput
            style={[styles.input, styles.textArea, { color: tokens.colors.text, borderColor: tokens.colors.border, backgroundColor: tokens.colors.cardSecondary }]}
            placeholder="Notes"
            placeholderTextColor={tokens.colors.textMuted}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
          <TransformationCTAButton
            label={saving ? 'Saving...' : 'Save check-in'}
            onPress={handleSubmit}
            disabled={saving}
            style={styles.submitButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {},
  screenSectionHeader: { marginBottom: spacing.lg },
  quickCard: { marginBottom: spacing.lg },
  sundayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 6,
    marginBottom: spacing.sm,
  },
  sundayBadgeText: { ...typography.label },
  quickTitle: { ...typography.headingMedium, marginBottom: 4 },
  lastWeight: { ...typography.bodySmall, marginBottom: spacing.sm },
  quickRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  quickInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.bodyLarge,
  },
  quickSaveBtnWrap: { minWidth: 100 },
  alertCard: { marginBottom: spacing.lg, borderWidth: 1 },
  alertTitle: { ...typography.headingSmall, marginBottom: 4 },
  alertText: { ...typography.bodyMedium },
  chartCard: { marginBottom: spacing.lg },
  formCard: { marginBottom: spacing.lg },
  formTitle: { ...typography.headingMedium, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.bodyLarge,
    marginBottom: spacing.sm,
  },
  textArea: { minHeight: 80 },
  submitButton: { marginTop: spacing.sm },
});
