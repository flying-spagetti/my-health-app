import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeTokens, borderRadius, spacing, typography } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { SectionHeader } from '@/components/design/SectionHeader';
import { Card } from '@/components/design/Card';
import MealPlanCard from '@/components/transformation/MealPlanCard';
import TransformationEmptyState from '@/components/transformation/TransformationEmptyState';
import TransformationCTAButton from '@/components/transformation/TransformationCTAButton';
import {
  getMealPlan,
  getTransformationGoals,
  getMealPlanAdherenceByDate,
  createMealPlanAdherence,
  updateMealPlanAdherence,
} from '@/services/db';
import { getMealPlanForDay } from '@/services/transformation';
import { useTransformationLayout } from '@/hooks/use-transformation-layout';

function getStartOfDay(date: number = Date.now()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getDateForDayOfWeek(dayOfWeek: number): number {
  const today = new Date();
  const todayDay = today.getDay();
  const diff = dayOfWeek - todayDay;
  const target = new Date(today);
  target.setDate(target.getDate() + diff);
  target.setHours(0, 0, 0, 0);
  return target.getTime();
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PlanScreen() {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const { scrollContentStyle } = useTransformationLayout();

  const [mealPlan, setMealPlan] = useState<any>(null);
  const [goals, setGoals] = useState<any>(null);
  const [meals, setMeals] = useState<any[]>([]);
  const [adherence, setAdherence] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [refreshing, setRefreshing] = useState(false);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [swapMeal, setSwapMeal] = useState('');
  const [swapReplacement, setSwapReplacement] = useState('');
  const adherenceRef = useRef<any>(null);
  const createInFlightRef = useRef(false);

  useEffect(() => {
    adherenceRef.current = adherence;
  }, [adherence]);

  const loadData = useCallback(async () => {
    createInFlightRef.current = false;
    const [plan, g, adh] = await Promise.all([
      getMealPlan(),
      getTransformationGoals(),
      getMealPlanAdherenceByDate(getDateForDayOfWeek(selectedDay)),
    ]);
    setMealPlan(plan);
    setGoals(g);
    setAdherence(adh);
    adherenceRef.current = adh;
    const dayIdx = selectedDay + 1;
    const dayMeals = await getMealPlanForDay(dayIdx);
    setMeals(Array.isArray(dayMeals) ? dayMeals : []);
  }, [selectedDay]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  useEffect(() => {
    loadData();
  }, [selectedDay]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSelectDay = (dayOfWeek: number) => {
    setSelectedDay(dayOfWeek);
  };

  const handleToggleMeal = (meal: string, completed: boolean) => {
    const prev = adherenceRef.current ?? adherence;
    const breakfast_completed = meal === 'breakfast' ? (completed ? 1 : 0) : (prev?.breakfast_completed ? 1 : 0);
    const lunch_completed = meal === 'lunch' ? (completed ? 1 : 0) : (prev?.lunch_completed ? 1 : 0);
    const post_workout_completed = meal === 'post-workout' ? (completed ? 1 : 0) : (prev?.post_workout_completed ? 1 : 0);
    const dinner_completed = meal === 'dinner' ? (completed ? 1 : 0) : (prev?.dinner_completed ? 1 : 0);

    const nextAdherence = {
      ...prev,
      breakfast_completed,
      lunch_completed,
      post_workout_completed,
      dinner_completed,
    };
    setAdherence(nextAdherence);
    adherenceRef.current = nextAdherence;

    const date = getDateForDayOfWeek(selectedDay);
    (async () => {
      try {
        if (prev?.id) {
          await updateMealPlanAdherence(prev.id, {
            breakfast_completed, lunch_completed, post_workout_completed, dinner_completed,
          });
        } else if (!createInFlightRef.current) {
          createInFlightRef.current = true;
          const newId = await createMealPlanAdherence({
            meal_plan_id: mealPlan?.id,
            adherence_date: date,
            day_of_week: selectedDay,
            breakfast_completed, lunch_completed, post_workout_completed, dinner_completed,
          });
          setAdherence((a) => (a && !a.id ? { ...a, id: newId } : a));
          adherenceRef.current = { ...(adherenceRef.current || nextAdherence), id: newId };
          createInFlightRef.current = false;
          const latest = adherenceRef.current;
          if (latest) {
            await updateMealPlanAdherence(newId, {
              breakfast_completed: latest.breakfast_completed ?? 0,
              lunch_completed: latest.lunch_completed ?? 0,
              post_workout_completed: latest.post_workout_completed ?? 0,
              dinner_completed: latest.dinner_completed ?? 0,
            });
          }
        }
      } catch (_) {
        createInFlightRef.current = false;
        loadData();
      }
    })();
  };

  const handleOpenSwap = () => {
    setSwapMeal('');
    setSwapReplacement('');
    setSwapModalVisible(true);
  };

  const handleSaveSwap = async () => {
    if (!swapMeal.trim() || !swapReplacement.trim()) return;

    const date = getDateForDayOfWeek(selectedDay);
    const existingSwaps = adherence?.swaps
      ? (typeof adherence.swaps === 'string' ? JSON.parse(adherence.swaps) : adherence.swaps)
      : [];
    const newSwaps = [...existingSwaps, { meal: swapMeal, replacement: swapReplacement.trim() }];

    if (adherence?.id) {
      await updateMealPlanAdherence(adherence.id, { swaps: newSwaps });
    } else {
      await createMealPlanAdherence({
        meal_plan_id: mealPlan?.id,
        adherence_date: date,
        day_of_week: selectedDay,
        breakfast_completed: 0,
        lunch_completed: 0,
        post_workout_completed: 0,
        dinner_completed: 0,
        swaps: newSwaps,
      });
    }
    setSwapModalVisible(false);
    await loadData();
  };

  const completed: Record<string, boolean> = adherence
    ? {
        breakfast: !!adherence.breakfast_completed,
        lunch: !!adherence.lunch_completed,
        'post-workout': !!adherence.post_workout_completed,
        dinner: !!adherence.dinner_completed,
      }
    : {};

  const completedCount = Object.values(completed).filter(Boolean).length;
  const totalMeals = meals.length || 4;

  const macros = goals
    ? {
        kcal: `${goals.calories_min}-${goals.calories_max}`,
        protein: `${goals.protein_min}-${goals.protein_max}`,
        fat: `${goals.fat_min}-${goals.fat_max}`,
        carbs: `${goals.carbs_min}-${goals.carbs_max}`,
      }
    : undefined;

  const isToday = (d: number) => d === new Date().getDay();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />
        }
      >
        <SectionHeader title="This week's plan" style={styles.screenSectionHeader} />

        <Card style={styles.daySelectorCard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelector}
          >
            {DAY_NAMES.map((name, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dayTab,
                  {
                    backgroundColor: selectedDay === i ? tokens.colors.primary : 'transparent',
                    borderColor: isToday(i) ? tokens.colors.primary : tokens.colors.border,
                  },
                ]}
                onPress={() => handleSelectDay(i)}
              >
                <Text
                  style={[
                    styles.dayTabText,
                    { color: selectedDay === i ? tokens.colors.textOnDark : tokens.colors.text },
                  ]}
                >
                  {name}
                </Text>
                {isToday(i) && (
                  <View style={[styles.todayDot, { backgroundColor: selectedDay === i ? tokens.colors.textOnDark : tokens.colors.primary }]} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        <Card style={styles.completionCard}>
          <View style={[styles.completionFillBg, { backgroundColor: tokens.colors.border + '40' }]}>
            <View
              style={[
                styles.completionFill,
                {
                  width: `${(completedCount / totalMeals) * 100}%`,
                  backgroundColor: tokens.colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.completionText, { color: tokens.colors.textMuted }]}>
            {completedCount}/{totalMeals} meals
          </Text>
        </Card>

        {meals.length > 0 ? (
          <>
            <Card style={styles.headerCard}>
              <Text style={[styles.dayLabel, { color: tokens.colors.textMuted }]}>
                {DAY_NAMES[selectedDay]}'s plan
              </Text>
              <Text style={[styles.macroHint, { color: tokens.colors.textMuted }]}>
                Target: {goals?.calories_min}-{goals?.calories_max} kcal, P: {goals?.protein_min}-{goals?.protein_max}g
              </Text>
            </Card>

            <MealPlanCard
              meals={meals}
              macros={macros}
              completed={completed}
              onToggleMeal={handleToggleMeal}
              onLogSwap={handleOpenSwap}
            />
          </>
        ) : (
          <Card>
            <TransformationEmptyState
              title="No plan for this day"
              description="Your 7-day plan is ready. Tap a day above to view meals."
            />
          </Card>
        )}
      </ScrollView>

      {/* Swap modal */}
      <Modal visible={swapModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSwapModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: tokens.colors.card }]}>
              <Text style={[styles.modalTitle, { color: tokens.colors.text }]}>Log swap</Text>
              <Text style={[styles.modalLabel, { color: tokens.colors.textMuted }]}>Meal swapped</Text>
              <View style={styles.mealOptions}>
                {['breakfast', 'lunch', 'post-workout', 'dinner'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.mealOption,
                      {
                        backgroundColor: swapMeal === m ? tokens.colors.primary + '30' : tokens.colors.cardSecondary + '80',
                        borderColor: swapMeal === m ? tokens.colors.primary : tokens.colors.border,
                      },
                    ]}
                    onPress={() => setSwapMeal(m)}
                  >
                    <Text style={[styles.mealOptionText, { color: tokens.colors.text }]}>
                      {m.charAt(0).toUpperCase() + m.slice(1).replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.modalLabel, { color: tokens.colors.textMuted }]}>Replacement</Text>
              <TextInput
                style={[styles.modalInput, { color: tokens.colors.text, backgroundColor: tokens.colors.cardSecondary, borderColor: tokens.colors.border }]}
                placeholder="e.g. Oatmeal instead of eggs"
                placeholderTextColor={tokens.colors.textMuted}
                value={swapReplacement}
                onChangeText={setSwapReplacement}
                multiline
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtnSecondary, { borderColor: tokens.colors.border }]}
                  onPress={() => setSwapModalVisible(false)}
                >
                  <Text style={[styles.modalBtnText, { color: tokens.colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.modalBtnPrimary}>
                  <TransformationCTAButton label="Save" onPress={handleSaveSwap} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {},
  screenSectionHeader: { marginBottom: spacing.lg },
  daySelectorCard: { marginBottom: spacing.md },
  daySelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  dayTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    minWidth: 52,
    alignItems: 'center',
  },
  dayTabText: { ...typography.label },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  completionCard: { marginBottom: spacing.md },
  completionFillBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  completionFill: { height: '100%', borderRadius: 4 },
  completionText: { ...typography.bodySmall },
  headerCard: { marginBottom: spacing.md },
  dayLabel: { ...typography.headingSmall, marginBottom: 4 },
  macroHint: { ...typography.bodySmall },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: { ...typography.headingLarge, marginBottom: spacing.md },
  modalLabel: { ...typography.bodyMedium, marginBottom: spacing.xs, marginTop: spacing.sm },
  mealOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  mealOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  mealOptionText: { ...typography.bodyMedium },
  modalInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.bodyLarge,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalBtnPrimary: { flex: 1 },
  modalBtnText: { ...typography.label },
});
