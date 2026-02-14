/**
 * Transformation Context – unified logical layer for the 6‑month transformation framework.
 * Re-exports and composes existing modules (db, transformation). No duplicate storage or UI.
 *
 * Unifies:
 * - Workout adherence (workout_logs, 5-day split tags)
 * - Macro/protein adherence (meal_plan_adherence, transformation_goals)
 * - Habit adherence (routine_checklists, categories: Skin/Hair/Supplements/Activity)
 * - Weekly check-ins (weekly_checkins + goal comparison)
 * - Supplement tracking (supplement_logs / routine_checklists)
 * - Skin routine (routine_checklists skin_am/pm)
 * - Hair routine (routine_checklists, hairline_checks with 28‑day rule)
 */

// Re-export transformation business logic and selectors
export {
  getRetinolNightsThisWeek,
  isRetinolNightToday,
  shouldWarnSunscreenAfterRetinol,
  getKetoconazoleDays,
  isKetoconazoleDay,
  getMicroneedlingDay,
  isMicroneedlingDay,
  canLogHairlineCheck,
  checkWeightPlateau,
  getMealPlanForDay,
  getMealPlanDayIndex,
  getWorkoutDayIndex,
  getWorkoutPlanForDay,
  HABIT_CATEGORIES,
  getCategoryCompletion,
  getWorkoutAdherencePct,
  getProteinCompliancePct,
  getHabitCompletionPct,
  getCheckinCompletionThisWeek,
  getTransformationScore,
  getCheckinGoalComparison,
  getWeeklyAdherenceSummary,
} from './transformation';

// Re-export DB helpers used by transformation (so callers can use context as single entry if needed)
export {
  getTransformationProfile,
  getTransformationGoals,
  getTransformationRoutines,
  getMealPlan,
  getWorkoutPlan,
  getMealPlanAdherenceByDate,
  getMealPlanAdherenceInRange,
  getRoutineChecklistByDate,
  getRoutineChecklistsInRange,
  createOrUpdateRoutineChecklist,
  getWorkoutLogs,
  createWorkoutLog,
  getWeeklyCheckins,
  createWeeklyCheckin,
  getLastHairlineCheck,
  createHairlineCheck,
  getHairlineChecks,
} from './db';

export { WORKOUT_SPLIT_TAGS } from './db';
