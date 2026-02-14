import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeTokens, typography, borderRadius, spacing } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { SectionHeader } from '@/components/design/SectionHeader';
import { Card } from '@/components/design/Card';
import TransformationCTAButton from '@/components/transformation/TransformationCTAButton';
import {
  getWorkoutPlan,
  getWorkoutLogs,
  createWorkoutLog,
  createOrUpdateRoutineChecklist,
} from '@/services/db';
import { getWorkoutPlanForDay, getWorkoutDayIndex } from '@/services/transformation';
import { useTransformationLayout } from '@/hooks/use-transformation-layout';

function getStartOfDay(date: number = Date.now()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

type LoggedSet = { reps?: string; weight?: string };

export default function WorkoutsScreen() {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const { scrollContentStyle } = useTransformationLayout();

  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedEx, setExpandedEx] = useState<Record<number, boolean>>({});
  const [loggedSets, setLoggedSets] = useState<Record<number, LoggedSet[]>>({});
  const [duration, setDuration] = useState('60');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const plan = await getWorkoutPlan();
    setWorkoutPlan(plan);

    const dayIdx = getWorkoutDayIndex();
    const dayPlan = await getWorkoutPlanForDay(dayIdx);
    setTodayWorkout(dayPlan);

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const logs = await getWorkoutLogs(weekAgo, Date.now());
    setRecentLogs(logs);
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

  const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const todayIdx = getWorkoutDayIndex();
  const todayName = dayNames[todayIdx] || 'Rest day';

  const toggleExpand = (i: number) => {
    setExpandedEx((prev) => ({ ...prev, [i]: !prev[i] }));
    const ex = todayWorkout?.exercises?.[i];
    if (ex && !loggedSets[i]) {
      const sets = Array(ex.sets || 3).fill(null).map(() => ({}));
      setLoggedSets((prev) => ({ ...prev, [i]: sets }));
    }
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight', value: string) => {
    setLoggedSets((prev) => {
      const arr = [...(prev[exIdx] || [])];
      while (arr.length <= setIdx) arr.push({});
      arr[setIdx] = { ...arr[setIdx], [field]: value };
      return { ...prev, [exIdx]: arr };
    });
  };

  const handleLogWorkout = async () => {
    if (!todayWorkout) return;
    setSaving(true);
    try {
      const exercises = (todayWorkout.exercises || []).map((ex: any, i: number) => {
        const sets = loggedSets[i] || [];
        return {
          ...ex,
          loggedSets: sets.filter((s) => s.reps || s.weight).length ? sets : undefined,
        };
      });

      await createWorkoutLog({
        workout_type: todayWorkout.name || 'Workout',
        day_number: todayIdx,
        exercises_data: exercises,
        duration: parseInt(duration, 10) || 60,
      });

      await createOrUpdateRoutineChecklist({
        checklist_date: getStartOfDay(),
        workout_done: true,
      });

      setLoggedSets({});
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Could not log workout');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToToday = (log: any) => {
    try {
      const data = typeof log.exercises_data === 'string'
        ? JSON.parse(log.exercises_data)
        : log.exercises_data || [];
      const sets: Record<number, LoggedSet[]> = {};
      (data as any[]).forEach((ex: any, i: number) => {
        if (ex.loggedSets?.length) {
          sets[i] = ex.loggedSets.map((s: any) => ({
            reps: String(s.reps ?? ''),
            weight: String(s.weight ?? ''),
          }));
        }
      });
      setLoggedSets(sets);
      setDuration(String(log.duration || 60));
    } catch (_) {}
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />
        }
      >
        <SectionHeader title="This week's training" style={styles.screenSectionHeader} />

        <Card style={styles.workoutCard}>
          <Text style={[styles.dayLabel, { color: tokens.colors.textMuted }]}>
            Today: {todayName}
          </Text>
          {todayWorkout ? (
            <>
              <Text style={[styles.workoutName, { color: tokens.colors.text }]}>
                {todayWorkout.name}
              </Text>
              {(todayWorkout.exercises || []).map((ex: any, i: number) => (
                <View key={i} style={[styles.exerciseCard, { borderColor: tokens.colors.border }]}>
                  <TouchableOpacity
                    style={styles.exerciseHeader}
                    onPress={() => toggleExpand(i)}
                  >
                    <Text style={[styles.exerciseName, { color: tokens.colors.text }]}>
                      {ex.name}
                    </Text>
                    <Text style={[styles.exerciseReps, { color: tokens.colors.textMuted }]}>
                      {ex.sets} x {ex.reps}
                    </Text>
                    <Ionicons
                      name={expandedEx[i] ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={tokens.colors.textMuted}
                    />
                  </TouchableOpacity>
                  {expandedEx[i] && (
                    <View style={[styles.setsSection, { borderTopColor: tokens.colors.border }]}>
                      <View style={styles.setsHeader}>
                        <Text style={[styles.setLabel, styles.setLabelNum, { color: tokens.colors.textMuted }]}>Set</Text>
                        <Text style={[styles.setLabel, { color: tokens.colors.textMuted, flex: 1 }]}>Reps</Text>
                        <Text style={[styles.setLabel, { color: tokens.colors.textMuted, flex: 1 }]}>Weight (kg)</Text>
                      </View>
                      {Array.from({ length: ex.sets || 3 }).map((_, setIdx) => (
                        <View key={setIdx} style={styles.setRow}>
                          <Text style={[styles.setNum, { color: tokens.colors.textMuted }]}>{setIdx + 1}</Text>
                          <TextInput
                            style={[styles.setInput, { color: tokens.colors.text, borderColor: tokens.colors.border }]}
                            placeholder="-"
                            placeholderTextColor={tokens.colors.textMuted}
                            keyboardType="number-pad"
                            value={loggedSets[i]?.[setIdx]?.reps ?? ''}
                            onChangeText={(v) => updateSet(i, setIdx, 'reps', v)}
                          />
                          <TextInput
                            style={[styles.setInput, { color: tokens.colors.text, borderColor: tokens.colors.border }]}
                            placeholder="-"
                            placeholderTextColor={tokens.colors.textMuted}
                            keyboardType="decimal-pad"
                            value={loggedSets[i]?.[setIdx]?.weight ?? ''}
                            onChangeText={(v) => updateSet(i, setIdx, 'weight', v)}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
              {todayWorkout.optionalInclineWalk && (
                <Text style={[styles.optional, { color: tokens.colors.textMuted }]}>
                  Optional: {todayWorkout.optionalInclineWalk}
                </Text>
              )}
              <View style={styles.durationRow}>
                <Text style={[styles.durationLabel, { color: tokens.colors.textMuted }]}>Duration (min)</Text>
                <TextInput
                  style={[styles.durationInput, { color: tokens.colors.text, borderColor: tokens.colors.border }]}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                />
              </View>
              <TransformationCTAButton
                label={saving ? 'Saving...' : 'Log workout'}
                onPress={handleLogWorkout}
                disabled={saving}
                style={styles.logButton}
              />
            </>
          ) : (
            <Text style={[styles.restDay, { color: tokens.colors.textMuted }]}>
              Rest day – recover well!
            </Text>
          )}
        </Card>

        <SectionHeader title="Recent workouts" style={styles.recentSectionHeader} />
        {recentLogs.slice(0, 7).map((log: any) => (
          <Card key={log.id} style={styles.logCard}>
            <View style={styles.logCardTop}>
              <View>
                <Text style={[styles.logType, { color: tokens.colors.text }]}>{log.workout_type}</Text>
                <Text style={[styles.logDate, { color: tokens.colors.textMuted }]}>
                  {new Date(log.started_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {log.duration ? ` • ${log.duration} min` : ''}
                </Text>
              </View>
              {todayWorkout && (
                <TouchableOpacity
                  style={[styles.copyBtn, { backgroundColor: tokens.colors.primary + '25' }]}
                  onPress={() => handleCopyToToday(log)}
                >
                  <Ionicons name="copy-outline" size={18} color={tokens.colors.primary} />
                  <Text style={[styles.copyBtnText, { color: tokens.colors.primary }]}>Copy</Text>
                </TouchableOpacity>
              )}
            </View>
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
  workoutCard: { marginBottom: spacing.lg },
  dayLabel: { ...typography.bodySmall, marginBottom: 4 },
  workoutName: { ...typography.headingLarge, marginBottom: spacing.md },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  exerciseName: { ...typography.headingSmall, flex: 1 },
  exerciseReps: { ...typography.bodyMedium },
  setsSection: {
    borderTopWidth: 1,
    padding: spacing.sm,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    gap: spacing.sm,
    paddingHorizontal: 4,
  },
  setLabel: { ...typography.bodySmall },
  setLabelNum: { width: 28, textAlign: 'center' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  setNum: { ...typography.bodySmall, width: 28, textAlign: 'center' },
  setInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    ...typography.bodyMedium,
  },
  optional: { ...typography.bodySmall, marginTop: spacing.sm, fontStyle: 'italic' },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  durationLabel: { ...typography.bodyMedium },
  durationInput: {
    width: 60,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    ...typography.bodyLarge,
    textAlign: 'center',
  },
  logButton: { marginTop: spacing.lg },
  restDay: { ...typography.bodyLarge },
  recentSectionHeader: { marginBottom: spacing.md },
  logCard: { marginBottom: spacing.sm },
  logCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logType: { ...typography.headingSmall },
  logDate: { ...typography.bodySmall, marginTop: 2 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    gap: 4,
  },
  copyBtnText: { ...typography.label },
});
