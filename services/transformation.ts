// services/transformation.ts
// Business logic for Transformation Tracker – habit rules, nutrition/workout/check-in aggregation.
// References existing db and does not duplicate storage.

import {
  getTransformationProfile,
  getTransformationGoals,
  getTransformationRoutines,
  getWeeklyCheckins,
  getLastHairlineCheck,
  getMealPlan,
  getWorkoutPlan,
  getMealPlanAdherenceByDate,
  getMealPlanAdherenceInRange,
  getRoutineChecklistByDate,
  getRoutineChecklistsInRange,
  getWorkoutLogs,
  getSteps,
} from './db';

const HAIRLINE_MIN_DAYS = 28;
const HAIRLINE_MAX_DAYS = 42;
const PLATEAU_WEEKS = 2;

/** Habit categories for grouped display (Skin AM/PM, Hair, Supplements, Activity). */
export const HABIT_CATEGORIES = {
  skin_am: {
    key: 'skin_am',
    label: 'Skin (AM)',
    checklistFields: ['skin_am_done', 'sunscreen_done'] as const,
  },
  skin_pm: {
    key: 'skin_pm',
    label: 'Skin (PM)',
    checklistFields: ['skin_pm_done', 'retinol_done'] as const,
  },
  hair: {
    key: 'hair',
    label: 'Hair',
    checklistFields: ['hair_wash_done', 'conditioner_done', 'ketoconazole_done', 'microneedling_done'] as const,
  },
  supplements: {
    key: 'supplements',
    label: 'Supplements',
    checklistFields: ['supplements_morning_done', 'supplements_postworkout_done', 'supplements_night_done'] as const,
  },
  activity: {
    key: 'activity',
    label: 'Activity',
    checklistFields: ['steps_done', 'workout_done'] as const,
  },
} as const;

/** Count completed items in a category for a checklist row. */
export function getCategoryCompletion(
  checklist: Record<string, unknown> | null,
  category: keyof typeof HABIT_CATEGORIES
): { done: number; total: number } {
  if (!checklist) {
    const c = HABIT_CATEGORIES[category];
    return { done: 0, total: c.checklistFields.length };
  }
  const c = HABIT_CATEGORIES[category];
  let done = 0;
  for (const f of c.checklistFields) {
    if (checklist[f]) done++;
  }
  return { done, total: c.checklistFields.length };
}

function getStartOfDay(date: number = Date.now()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Retinol schedule: Weeks 1-4: 2-3 nights/week. After: every other night if tolerated.
 * Returns which nights retinol is recommended this week (0=Sun, 6=Sat).
 */
export function getRetinolNightsThisWeek(weekNumber: number): number[] {
  if (weekNumber <= 4) {
    return [1, 3, 5]; // Tue, Thu, Sat - 2-3x
  }
  return [0, 2, 4, 6]; // Every other night: Sun, Tue, Thu, Sat
}

/**
 * Check if today is a retinol night based on plan start date.
 * If no planStartDate provided, uses Tue/Thu/Sat as default (weeks 1-4).
 */
export function isRetinolNightToday(planStartDate?: number): boolean {
  const now = Date.now();
  const weekNumber = planStartDate
    ? Math.floor((now - planStartDate) / (7 * 24 * 60 * 60 * 1000)) + 1
    : 1;
  const nights = getRetinolNightsThisWeek(weekNumber);
  const today = new Date().getDay();
  return nights.includes(today);
}

/**
 * Sunscreen warning: if retinol was used last night and sunscreen not done today, warn.
 */
export async function shouldWarnSunscreenAfterRetinol(date: number = Date.now()): Promise<boolean> {
  const checklist = await getRoutineChecklistByDate(date);
  if (checklist?.sunscreen_done) return false;

  const yesterday = date - 24 * 60 * 60 * 1000;
  const yesterdayChecklist = await getRoutineChecklistByDate(yesterday);
  return !!(yesterdayChecklist?.retinol_done);
}

/**
 * Ketoconazole schedule: 2x/week. Returns suggested days (e.g. Sun, Wed).
 */
export function getKetoconazoleDays(): number[] {
  return [0, 3]; // Sunday, Wednesday
}

/**
 * Check if today is a ketoconazole wash day.
 */
export function isKetoconazoleDay(date: number = Date.now()): boolean {
  const day = new Date(date).getDay();
  return getKetoconazoleDays().includes(day);
}

/** Microneedling: 1x weekly. Default Sunday (day 0). */
const MICRONEEDLING_DAY = 0;

export function getMicroneedlingDay(): number {
  return MICRONEEDLING_DAY;
}

export function isMicroneedlingDay(date: number = Date.now()): boolean {
  return new Date(date).getDay() === MICRONEEDLING_DAY;
}

/**
 * Hairline check: enforce 4-6 week interval. Warn if logging within 28 days of last.
 */
export async function canLogHairlineCheck(): Promise<{
  allowed: boolean;
  daysSinceLast: number | null;
  message: string;
}> {
  const last = await getLastHairlineCheck();
  if (!last) {
    return { allowed: true, daysSinceLast: null, message: '' };
  }

  const now = Date.now();
  const daysSinceLast = Math.floor((now - last.check_date) / (24 * 60 * 60 * 1000));

  if (daysSinceLast < HAIRLINE_MIN_DAYS) {
    return {
      allowed: false,
      daysSinceLast,
      message: `Hairline checks should be spaced 4-6 weeks apart. Last check was ${daysSinceLast} days ago. Recommended window: 28-42 days.`,
    };
  }

  if (daysSinceLast > HAIRLINE_MAX_DAYS) {
    return {
      allowed: true,
      daysSinceLast,
      message: `It's been ${daysSinceLast} days since your last check. Good time to log a progress check.`,
    };
  }

  return {
    allowed: true,
    daysSinceLast,
    message: `Last check was ${daysSinceLast} days ago. You're in the recommended 4-6 week window.`,
  };
}

/**
 * Weight plateau detection: if weekly average unchanged for 2 consecutive weeks, suggest carb reduction.
 */
export async function checkWeightPlateau(): Promise<{
  isPlateau: boolean;
  suggestion: string | null;
  recentWeights: number[];
}> {
  const checkins = await getWeeklyCheckins(4);
  const weights = checkins
    .filter((c: any) => c.weight_kg != null)
    .map((c: any) => c.weight_kg as number)
    .slice(0, 4);

  if (weights.length < PLATEAU_WEEKS * 2) {
    return { isPlateau: false, suggestion: null, recentWeights: weights };
  }

  const recent = weights.slice(0, PLATEAU_WEEKS);
  const older = weights.slice(PLATEAU_WEEKS, PLATEAU_WEEKS * 2);
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
  const diff = Math.abs(avgRecent - avgOlder);

  if (diff < 0.3) {
    return {
      isPlateau: true,
      suggestion: 'Weight unchanged for 2 weeks. Consider reducing carbs by 20-30g if fat loss is the goal.',
      recentWeights: weights,
    };
  }

  return { isPlateau: false, suggestion: null, recentWeights: weights };
}

/**
 * Get meal plan for a given day (1-7) based on rotation.
 */
export async function getMealPlanForDay(dayOfWeek: number): Promise<any> {
  const plan = await getMealPlan();
  if (!plan) return null;

  const dayKey = `day_${dayOfWeek}_meals` as keyof typeof plan;
  const meals = plan[dayKey];
  if (typeof meals === 'string') {
    try {
      return JSON.parse(meals);
    } catch {
      return [];
    }
  }
  return meals || [];
}

/**
 * Get current day of week (1-7) for meal plan mapping.
 * Plan: day 1 = Sun (High Protein), day 2 = Mon (Omega-3), ... day 7 = Sat.
 */
export function getMealPlanDayIndex(date: number = Date.now()): number {
  const d = new Date(date).getDay();
  return d + 1;
}

/**
 * Get workout day index (1-5 for Mon-Fri, 0 for weekend).
 */
export function getWorkoutDayIndex(date: number = Date.now()): number {
  const d = new Date(date).getDay();
  return d >= 1 && d <= 5 ? d : 0;
}

/**
 * Get workout plan for day (1-5, Mon-Fri).
 */
export async function getWorkoutPlanForDay(dayOfWeek: number): Promise<any> {
  const plan = await getWorkoutPlan();
  if (!plan) return null;

  const dayNum = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek : 1;
  const dayKey = `day_${dayNum}_exercises` as keyof typeof plan;
  const exercises = plan[dayKey];
  if (typeof exercises === 'string') {
    try {
      return JSON.parse(exercises);
    } catch {
      return null;
    }
  }
  return exercises || null;
}

// ---------- Transformation Context: computed selectors (no redundant storage) ----------

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function getWeekStart(date: number): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getTime() - (day === 0 ? 6 : day - 1) * DAY_MS;
  return new Date(diff).setHours(0, 0, 0, 0);
}

/** Workout adherence: % of expected sessions completed in the last 7 days (5-day split = up to 5/week). */
export async function getWorkoutAdherencePct(weekStart?: number): Promise<number> {
  const start = weekStart ?? getWeekStart(Date.now());
  const end = start + WEEK_MS - 1;
  const logs = await getWorkoutLogs(start, end);
  const expected = 5;
  const completed = logs.length;
  if (expected <= 0) return 100;
  return Math.min(100, Math.round((completed / expected) * 100));
}

/** Protein compliance: % of days in range where protein_grams >= goal min, or meal plan completion as proxy. */
export async function getProteinCompliancePct(weekStart?: number): Promise<number> {
  const goals = await getTransformationGoals();
  const proteinMin = goals?.protein_min ?? 0;
  const start = weekStart ?? getWeekStart(Date.now());
  const end = start + WEEK_MS - 1;
  const adherences = await getMealPlanAdherenceInRange(start, end);
  if (adherences.length === 0) return 0;
  let compliantDays = 0;
  for (const a of adherences) {
    if (a.protein_grams != null && proteinMin > 0) {
      if (a.protein_grams >= proteinMin) compliantDays++;
    } else {
      const meals = (a.breakfast_completed ? 1 : 0) + (a.lunch_completed ? 1 : 0) + (a.post_workout_completed ? 1 : 0) + (a.dinner_completed ? 1 : 0);
          if (meals >= 3) compliantDays++;
    }
  }
  return proteinMin > 0 && adherences.some((a) => a.protein_grams != null)
    ? Math.round((compliantDays / adherences.length) * 100)
    : Math.round((compliantDays / 7) * 100);
}

/** Habit completion % for the week: routine_checklists done items / total possible. */
export async function getHabitCompletionPct(weekStart?: number): Promise<number> {
  const start = weekStart ?? getWeekStart(Date.now());
  const end = start + WEEK_MS - 1;
  const checklists = await getRoutineChecklistsInRange(start, end);
  const doneFields = [
    'skin_am_done', 'skin_pm_done', 'sunscreen_done', 'retinol_done', 'hair_wash_done',
    'conditioner_done', 'beard_oil_done', 'supplements_morning_done', 'supplements_postworkout_done',
    'supplements_night_done', 'workout_done', 'ketoconazole_done', 'microneedling_done',
  ];
  let total = 0;
  let done = 0;
  for (const cl of checklists) {
    for (const f of doneFields) {
      total++;
      if (cl[f]) done++;
    }
  }
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

/** Weekly check-in completion: 1 if current week has a check-in, else 0 (for score * 100). */
export async function getCheckinCompletionThisWeek(weekStart?: number): Promise<number> {
  const start = weekStart ?? getWeekStart(Date.now());
  const end = start + WEEK_MS - 1;
  const checkins = await getWeeklyCheckins(10);
  const hasThisWeek = checkins.some((c: any) => c.checkin_date >= start && c.checkin_date <= end);
  return hasThisWeek ? 100 : 0;
}

/**
 * Transformation score 0–100 from: workout adherence, protein compliance, habit %, check-in completion.
 * Weights: workout 25%, protein 25%, habits 35%, check-in 15%.
 */
export async function getTransformationScore(weekStart?: number): Promise<{
  score: number;
  workoutPct: number;
  proteinPct: number;
  habitPct: number;
  checkinPct: number;
}> {
  const start = weekStart ?? getWeekStart(Date.now());
  const [workoutPct, proteinPct, habitPct, checkinPct] = await Promise.all([
    getWorkoutAdherencePct(start),
    getProteinCompliancePct(start),
    getHabitCompletionPct(start),
    getCheckinCompletionThisWeek(start),
  ]);
  const score = Math.round(
    workoutPct * 0.25 + proteinPct * 0.25 + habitPct * 0.35 + checkinPct * 0.15
  );
  return {
    score: Math.min(100, Math.max(0, score)),
    workoutPct,
    proteinPct,
    habitPct,
    checkinPct,
  };
}

/** Check-in vs transformation goals: current weight/BF vs target. */
export async function getCheckinGoalComparison(): Promise<{
  currentWeight: number | null;
  targetWeightMin: number | null;
  targetWeightMax: number | null;
  currentBodyFat: number | null;
  targetBodyFatMin: number | null;
  targetBodyFatMax: number | null;
  weightOnTrack: boolean | null;
  bodyFatOnTrack: boolean | null;
}> {
  const [goals, checkins] = await Promise.all([getTransformationGoals(), getWeeklyCheckins(1)]);
  const latest = checkins?.[0];
  const currentWeight = latest?.weight_kg ?? null;
  const currentBodyFat = latest?.body_fat_pct ?? null;
  const targetWeightMin = goals?.target_weight_min ?? null;
  const targetWeightMax = goals?.target_weight_max ?? null;
  const targetBodyFatMin = goals?.target_body_fat_min ?? null;
  const targetBodyFatMax = goals?.target_body_fat_max ?? null;
  let weightOnTrack: boolean | null = null;
  let bodyFatOnTrack: boolean | null = null;
  if (currentWeight != null && targetWeightMin != null && targetWeightMax != null) {
    weightOnTrack = currentWeight >= targetWeightMin && currentWeight <= targetWeightMax;
  }
  if (currentBodyFat != null && targetBodyFatMin != null && targetBodyFatMax != null) {
    bodyFatOnTrack = currentBodyFat >= targetBodyFatMin && currentBodyFat <= targetBodyFatMax;
  }
  return {
    currentWeight,
    targetWeightMin,
    targetWeightMax,
    currentBodyFat,
    targetBodyFatMin,
    targetBodyFatMax,
    weightOnTrack,
    bodyFatOnTrack,
  };
}

/** Adherence summary for the current week (for check-in or dashboard). */
export async function getWeeklyAdherenceSummary(weekStart?: number): Promise<{
  workoutPct: number;
  proteinPct: number;
  habitPct: number;
  checkinDone: boolean;
  score: number;
}> {
  const start = weekStart ?? getWeekStart(Date.now());
  const [workoutPct, proteinPct, habitPct, checkinPct, scoreResult] = await Promise.all([
    getWorkoutAdherencePct(start),
    getProteinCompliancePct(start),
    getHabitCompletionPct(start),
    getCheckinCompletionThisWeek(start),
    getTransformationScore(start),
  ]);
  return {
    workoutPct,
    proteinPct,
    habitPct,
    checkinDone: checkinPct >= 100,
    score: scoreResult.score,
  };
}
