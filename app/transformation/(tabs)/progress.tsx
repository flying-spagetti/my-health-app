import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getThemeTokens, typography, borderRadius, spacing } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { SectionHeader } from '@/components/design/SectionHeader';
import { Card } from '@/components/design/Card';
import ProgressChart from '@/components/transformation/ProgressChart';
import AdherenceRing from '@/components/transformation/AdherenceRing';
import TransformationCTAButton from '@/components/transformation/TransformationCTAButton';
import {
  getWeeklyCheckins,
  getWorkoutLogs,
  getRoutineChecklistByDate,
  getTransformationStreak,
  getTransformationGoals,
  getTransformationProfile,
} from '@/services/db';
import { useTransformationLayout } from '@/hooks/use-transformation-layout';

function getStartOfDay(date: number = Date.now()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getWeekStart(date: number): number {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function ProgressScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const { scrollContentStyle, chartWidth } = useTransformationLayout();

  const [checkins, setCheckins] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [weeklyAdherence, setWeeklyAdherence] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [goals, setGoals] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [todayDone, setTodayDone] = useState(0);
  const [todayTotal, setTodayTotal] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [c, w, str, g, p] = await Promise.all([
      getWeeklyCheckins(12),
      getWorkoutLogs(Date.now() - 30 * 24 * 60 * 60 * 1000, Date.now()),
      getTransformationStreak(),
      getTransformationGoals(),
      getTransformationProfile(),
    ]);
    setCheckins(c);
    setGoals(g);
    setProfile(p);

    const workoutsByWeek: Record<number, number> = {};
    for (let i = 0; i < 4; i++) {
      workoutsByWeek[getWeekStart(Date.now() - i * 7 * 24 * 60 * 60 * 1000)] = 0;
    }
    w.forEach((log: any) => {
      const weekStart = getWeekStart(log.started_at);
      if (workoutsByWeek[weekStart] !== undefined) workoutsByWeek[weekStart]++;
    });
    setWorkouts(
      Object.entries(workoutsByWeek)
        .map(([date, count]) => ({ date: parseInt(date, 10), value: count }))
        .sort((a, b) => a.date - b.date)
    );

    const adherence: number[] = [];
    for (let i = 0; i < 7; i++) {
      const day = getStartOfDay(Date.now() - i * 24 * 60 * 60 * 1000);
      const cl = await getRoutineChecklistByDate(day);
      const items = [
        cl?.skin_am_done, cl?.skin_pm_done, cl?.sunscreen_done, cl?.hair_wash_done,
        cl?.supplements_morning_done, cl?.supplements_night_done, cl?.workout_done,
      ].filter(Boolean).length;
      adherence.push(Math.round((items / 7) * 100));
    }
    setWeeklyAdherence(adherence.reverse());

    const todayCl = await getRoutineChecklistByDate(getStartOfDay());
    const doneFields = [
      'skin_am_done', 'skin_pm_done', 'sunscreen_done', 'hair_wash_done', 'conditioner_done',
      'beard_oil_done', 'supplements_morning_done', 'supplements_postworkout_done',
      'supplements_night_done', 'workout_done',
    ];
    setTodayDone(doneFields.filter((f) => todayCl?.[f]).length);
    setTodayTotal(10);

    setStreak(str);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const weightData = checkins
    .filter((c) => c.weight_kg != null)
    .map((c) => ({ date: c.checkin_date, value: c.weight_kg }))
    .reverse();

  const avgAdherence =
    weeklyAdherence.length > 0
      ? Math.round(weeklyAdherence.reduce((a, b) => a + b, 0) / weeklyAdherence.length)
      : 0;

  const thisWeekPct =
    weeklyAdherence.length > 0 ? weeklyAdherence[weeklyAdherence.length - 1] : 0;

  const startTs = profile?.created_at || Date.now();
  const monthsElapsed = (Date.now() - startTs) / (30 * 24 * 60 * 60 * 1000);
  const timelineMonths = goals?.timeline_months ?? 6;
  const month1Pct = Math.min(100, (monthsElapsed / 1) * 100);
  const month3Pct = Math.min(100, (monthsElapsed / 3) * 100);
  const month6Pct = Math.min(100, (monthsElapsed / 6) * 100);

  const today = getStartOfDay();
  const hasCheckinToday = checkins.some((c) => {
    const d = new Date(c.checkin_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today && c.weight_kg != null;
  });
  const isSunday = new Date().getDay() === 0;

  let whatsNext = "Complete today's checklist to build your streak";
  if (todayDone >= todayTotal) {
    whatsNext = "You're all set for today! Great job.";
  } else if (isSunday && !hasCheckinToday) {
    whatsNext = 'Log Sunday weigh-in to track your progress';
  } else if (todayTotal - todayDone <= 2) {
    whatsNext = `${todayTotal - todayDone} more tasks to hit 100% today`;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />
        }
      >
        <SectionHeader title="Your progress" style={styles.screenSectionHeader} />

        <Card padding="xl" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <AdherenceRing value={avgAdherence} label="Adherence" size={100} strokeWidth={10} />
            <View style={styles.heroStats}>
              {streak > 0 && (
                <View style={[styles.streakBadge, { backgroundColor: tokens.colors.primary + '25' }]}>
                  <Ionicons name="flame" size={20} color={tokens.colors.primary} />
                  <Text style={[styles.streakText, { color: tokens.colors.primary }]}>{streak}-day streak</Text>
                </View>
              )}
              <Text style={[styles.weekPct, { color: tokens.colors.text }]}>
                {thisWeekPct}% this week
              </Text>
            </View>
          </View>
        </Card>

        <Card variant="highlighted" style={styles.whatsNextCard}>
          <Ionicons name="sparkles" size={20} color={tokens.colors.primary} style={styles.whatsNextIcon} />
          <Text style={[styles.whatsNextText, { color: tokens.colors.text }]}>{whatsNext}</Text>
          {isSunday && !hasCheckinToday && (
            <TransformationCTAButton
              label="Log weigh-in"
              onPress={() => router.push('/transformation/checkins')}
              style={styles.whatsNextBtn}
            />
          )}
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

        <Card padding="lg" style={styles.milestoneCard}>
          <Text style={[styles.milestoneTitle, { color: tokens.colors.text }]}>Milestones</Text>
          <MilestoneRow label="Month 1 – Baseline established" pct={month1Pct} tokens={tokens} />
          <MilestoneRow label="Month 3 – Midpoint check" pct={month3Pct} tokens={tokens} />
          <MilestoneRow label="Month 6 – Final assessment" pct={month6Pct} tokens={tokens} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function MilestoneRow({
  label,
  pct,
  tokens,
}: {
  label: string;
  pct: number;
  tokens: ReturnType<typeof getThemeTokens>;
}) {
  return (
    <View style={styles.milestoneRow}>
      <Text style={[styles.milestoneItem, { color: tokens.colors.text }]}>{label}</Text>
      <View style={[styles.milestoneBarBg, { backgroundColor: tokens.colors.border + '40' }]}>
        <View
          style={[
            styles.milestoneBarFill,
            {
              width: `${Math.min(100, pct)}%`,
              backgroundColor: pct >= 100 ? tokens.colors.success : tokens.colors.primary,
            },
          ]}
        />
      </View>
      <Text style={[styles.milestonePct, { color: tokens.colors.textMuted }]}>
        {Math.round(pct)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {},
  screenSectionHeader: { marginBottom: spacing.lg },
  heroCard: { marginBottom: spacing.md },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  heroStats: { gap: spacing.sm },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  streakText: { ...typography.bodyMedium, fontFamily: 'Nunito-SemiBold' },
  weekPct: { ...typography.bodyLarge, fontFamily: 'Nunito-SemiBold' },
  whatsNextCard: { marginBottom: spacing.lg },
  whatsNextIcon: { marginBottom: spacing.xs },
  whatsNextText: { ...typography.bodyMedium },
  whatsNextBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  chartCard: { marginBottom: spacing.md },
  milestoneCard: { marginBottom: spacing.md },
  milestoneTitle: { ...typography.headingMedium, marginBottom: spacing.md },
  milestoneRow: { marginBottom: spacing.md },
  milestoneItem: { ...typography.bodyMedium, marginBottom: 4 },
  milestoneBarBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 2 },
  milestoneBarFill: { height: '100%', borderRadius: 3 },
  milestonePct: { ...typography.bodySmall },
});
