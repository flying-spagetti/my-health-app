import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeTokens, typography, spacing, borderRadius } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { SectionHeader } from '@/components/design/SectionHeader';
import { Card } from '@/components/design/Card';
import DailyChecklist, { ChecklistItem } from '@/components/transformation/DailyChecklist';
import StepsStepper from '@/components/transformation/StepsStepper';
import {
  getRoutineChecklistByDate,
  createOrUpdateRoutineChecklist,
  getSteps,
  saveSteps,
  getTransformationStreak,
} from '@/services/db';
import { isRetinolNightToday, isKetoconazoleDay } from '@/services/transformation';
import { useTransformationLayout } from '@/hooks/use-transformation-layout';
import Ionicons from '@expo/vector-icons/Ionicons';

function getStartOfDay(date: number = Date.now()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getCurrentPeriod(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

type SectionKey = 'morning' | 'afternoon' | 'evening';

export default function TodayScreen() {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const { scrollContentStyle } = useTransformationLayout();

  const [checklist, setChecklist] = useState<any>(null);
  const [stepsValue, setStepsValue] = useState(0);
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>(() => {
    const p = getCurrentPeriod();
    return { morning: p === 'morning', afternoon: p === 'afternoon', evening: p === 'evening' };
  });
  const saveStepsRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    const today = getStartOfDay();
    const [cl, stepsData, str] = await Promise.all([
      getRoutineChecklistByDate(today),
      getSteps(today, today + 86400000 - 1),
      getTransformationStreak(),
    ]);
    setChecklist(cl);
    const todaySteps = stepsData.find((s: any) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today;
    });
    setStepsValue(todaySteps?.steps ?? 0);
    setStreak(str);
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

  const toggleSection = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const morningItems: ChecklistItem[] = [
    { id: 'am_routine', label: 'Cleanser → Vitamin C → Moisturizer', done: !!checklist?.skin_am_done },
    { id: 'sunscreen', label: 'Sunscreen SPF 50 (non-negotiable)', done: !!checklist?.sunscreen_done },
    {
      id: 'hair_wash',
      label: isKetoconazoleDay() ? 'Ketoconazole 2% shampoo (4-5 min)' : 'Gentle shampoo',
      done: !!checklist?.hair_wash_done,
    },
    { id: 'conditioner', label: 'Conditioner (mid-length to ends)', done: !!checklist?.conditioner_done },
    { id: 'morning', label: 'Morning stack (D3, Multi, Omega-3, etc.)', done: !!checklist?.supplements_morning_done },
  ];

  const afternoonItems: ChecklistItem[] = [
    { id: 'postworkout', label: 'Post-workout (Whey + Creatine)', done: !!checklist?.supplements_postworkout_done },
    { id: 'workout', label: "Today's workout done", done: !!checklist?.workout_done },
  ];

  const eveningItems: ChecklistItem[] = [
    { id: 'pm_routine', label: 'Cleanser → Niacinamide → Moisturizer', done: !!checklist?.skin_pm_done },
    {
      id: 'retinol',
      label: isRetinolNightToday() ? 'Retinol serum 0.3% (tonight)' : 'Retinol (not scheduled)',
      done: !!checklist?.retinol_done,
      optional: !isRetinolNightToday(),
    },
    { id: 'night', label: 'Night stack (Mg, Ashwagandha, Zn)', done: !!checklist?.supplements_night_done },
    { id: 'beard_oil', label: 'Beard oil', done: !!checklist?.beard_oil_done },
  ];

  const handleToggle = (category: string, value: boolean) => {
    const today = getStartOfDay();
    const updates: Record<string, any> = { checklist_date: today };
    switch (category) {
      case 'skin_am': updates.skin_am_done = value; break;
      case 'sunscreen': updates.sunscreen_done = value; break;
      case 'skin_pm': updates.skin_pm_done = value; break;
      case 'retinol': updates.retinol_done = value; break;
      case 'hair_wash': updates.hair_wash_done = value; break;
      case 'conditioner': updates.conditioner_done = value; break;
      case 'beard_oil': updates.beard_oil_done = value; break;
      case 'supplements_morning': updates.supplements_morning_done = value; break;
      case 'supplements_postworkout': updates.supplements_postworkout_done = value; break;
      case 'supplements_night': updates.supplements_night_done = value; break;
      case 'workout': updates.workout_done = value; break;
      default: return;
    }

    setChecklist((prev) => ({
      ...(prev || {}),
      checklist_date: today,
      ...updates,
    }));

    createOrUpdateRoutineChecklist(updates).catch(() => loadData());
  };

  const handleSkinAmToggle = (id: string, done: boolean) => {
    if (id === 'sunscreen') handleToggle('sunscreen', done);
    else handleToggle('skin_am', done);
  };

  const handleSkinPmToggle = (id: string, done: boolean) => {
    if (id === 'retinol') handleToggle('retinol', done);
    else handleToggle('skin_pm', done);
  };

  const handleHairToggle = (id: string, done: boolean) => {
    if (id === 'hair_wash') handleToggle('hair_wash', done);
    else if (id === 'conditioner') handleToggle('conditioner', done);
    else handleToggle('beard_oil', done);
  };

  const handleSupplementToggle = (id: string, done: boolean) => {
    if (id === 'morning') handleToggle('supplements_morning', done);
    else if (id === 'postworkout') handleToggle('supplements_postworkout', done);
    else handleToggle('supplements_night', done);
  };

  const handleWorkoutToggle = (_: string, done: boolean) => handleToggle('workout', done);

  const handleStepsChange = (v: number) => {
    setStepsValue(v);
    if (saveStepsRef.current) clearTimeout(saveStepsRef.current);
    saveStepsRef.current = setTimeout(async () => {
      await saveSteps({ steps: v, date: getStartOfDay() });
    }, 400);
  };

  const sectionDone = (items: ChecklistItem[]) => items.filter((i) => i.done).length;
  const sectionTotal = (items: ChecklistItem[]) => items.filter((i) => !i.optional).length + (items.some((i) => i.optional) ? 1 : 0);

  const adherencePct = checklist
    ? Math.round(
        ([
          checklist.skin_am_done, checklist.skin_pm_done, checklist.sunscreen_done,
          checklist.hair_wash_done, checklist.conditioner_done, checklist.beard_oil_done,
          checklist.supplements_morning_done, checklist.supplements_postworkout_done,
          checklist.supplements_night_done, checklist.workout_done,
        ].filter(Boolean).length / 10) * 100
      )
    : 0;

  const CollapsibleSectionHeader = ({
    title,
    icon,
    count,
    total,
    isOpen,
    onPress,
  }: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    count: number;
    total: number;
    isOpen: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.sectionHeaderRow, { borderBottomColor: tokens.colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={22} color={tokens.colors.primary} />
      <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>{title}</Text>
      <Text style={[styles.sectionCount, { color: tokens.colors.textMuted }]}>
        {count}/{total}
      </Text>
      <Ionicons
        name={isOpen ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={tokens.colors.textMuted}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={scrollContentStyle}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />
        }
      >
        <SectionHeader title="Today's routine" style={styles.screenSectionHeader} />

        {(streak > 0 || adherencePct === 0) && (
          <Card style={styles.topCard}>
            {streak > 0 ? (
              <View style={[styles.streakBadge, { backgroundColor: tokens.colors.primary + '25', borderColor: tokens.colors.primary }]}>
                <Ionicons name="flame" size={18} color={tokens.colors.primary} />
                <Text style={[styles.streakText, { color: tokens.colors.primary }]}>{streak}-day streak</Text>
              </View>
            ) : (
              <Text style={[styles.emptyHintText, { color: tokens.colors.textMuted }]}>
                Start your morning routine to begin your streak
              </Text>
            )}
          </Card>
        )}

        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: tokens.colors.text }]}>Today's progress</Text>
          <Text style={[styles.summaryValue, { color: tokens.colors.primary }]}>{adherencePct}%</Text>
        </Card>

        {/* Morning */}
        <View style={styles.section}>
          <Card padding="md" style={styles.sectionCard}>
            <CollapsibleSectionHeader
              title="Morning"
              icon="sunny-outline"
              count={sectionDone(morningItems)}
              total={morningItems.length}
              isOpen={expanded.morning}
              onPress={() => toggleSection('morning')}
            />
            {expanded.morning && (
              <>
                <View style={[styles.sectionDivider, { borderTopColor: tokens.colors.border }]} />
                <DailyChecklist title="" items={morningItems} embedded onToggle={(id, done) => {
                  if (id === 'sunscreen') handleSkinAmToggle('sunscreen', done);
                  else if (id === 'am_routine') handleSkinAmToggle('am_routine', done);
                  else if (id === 'hair_wash' || id === 'conditioner') handleHairToggle(id, done);
                  else handleSupplementToggle(id, done);
                }} />
                <View style={[styles.stepsCard, { borderTopColor: tokens.colors.border }]}>
                  <Text style={[styles.stepsLabel, { color: tokens.colors.text }]}>Steps</Text>
                  <StepsStepper value={stepsValue} onChange={handleStepsChange} goal={10000} />
                </View>
              </>
            )}
          </Card>
        </View>

        {/* Afternoon */}
        <View style={styles.section}>
          <Card padding="md" style={styles.sectionCard}>
            <CollapsibleSectionHeader
              title="Afternoon"
              icon="partly-sunny-outline"
              count={sectionDone(afternoonItems)}
              total={afternoonItems.length}
              isOpen={expanded.afternoon}
              onPress={() => toggleSection('afternoon')}
            />
            {expanded.afternoon && (
              <>
                <View style={[styles.sectionDivider, { borderTopColor: tokens.colors.border }]} />
                <DailyChecklist
                  title=""
                  items={afternoonItems}
                  embedded
                  onToggle={(id, done) => (id === 'workout' ? handleWorkoutToggle(id, done) : handleSupplementToggle(id, done))}
                />
              </>
            )}
          </Card>
        </View>

        {/* Evening */}
        <View style={styles.section}>
          <Card padding="md" style={styles.sectionCard}>
            <CollapsibleSectionHeader
              title="Evening"
              icon="moon-outline"
              count={sectionDone(eveningItems)}
              total={eveningItems.length}
              isOpen={expanded.evening}
              onPress={() => toggleSection('evening')}
            />
            {expanded.evening && (
              <>
                <View style={[styles.sectionDivider, { borderTopColor: tokens.colors.border }]} />
                <DailyChecklist
                  title=""
                  items={eveningItems}
                  embedded
                  onToggle={(id, done) => {
                    if (id === 'retinol') handleSkinPmToggle('retinol', done);
                    else if (id === 'pm_routine') handleSkinPmToggle('pm_routine', done);
                    else if (id === 'beard_oil') handleHairToggle('beard_oil', done);
                    else handleSupplementToggle(id, done);
                  }}
                />
              </>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenSectionHeader: { marginBottom: spacing.lg },
  topCard: { marginBottom: spacing.md, alignItems: 'center' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  streakText: { ...typography.bodyMedium, fontFamily: 'Nunito-SemiBold' },
  emptyHintText: { ...typography.bodyMedium, textAlign: 'center' },
  summaryCard: { marginBottom: spacing.md, alignItems: 'center' },
  summaryTitle: { ...typography.headingSmall, marginBottom: 4 },
  summaryValue: { ...typography.displayLarge, fontSize: 32 },
  section: { marginBottom: spacing.md },
  sectionCard: { marginBottom: 0 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    borderBottomWidth: 0,
  },
  sectionDivider: { borderTopWidth: 1, marginTop: spacing.sm, paddingTop: spacing.sm },
  sectionTitle: { ...typography.headingMedium, flex: 1 },
  sectionCount: { ...typography.bodyMedium },
  stepsCard: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  stepsLabel: { ...typography.headingSmall, marginBottom: spacing.xs },
});
