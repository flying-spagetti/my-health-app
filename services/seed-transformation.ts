// services/seed-transformation.ts
// Seed data for Transformation Tracker - 21yo male 6-month recomp plan

import {
  createTransformationProfile,
  createTransformationGoals,
  createTransformationRoutines,
  createMealPlan,
  createWorkoutPlan,
  createTransformationReminder,
  getTransformationProfile,
  getMealPlan,
  getWorkoutPlan,
} from './db';

const DEFAULT_PROFILE = {
  age: 21,
  sex: 'male',
  height_cm: 171,
  weight_kg: 78,
  body_fat_pct: 23,
  diet: 'non-veg',
  training_frequency: '5 days/week',
  sleep_hours: '7-8',
  smoking: 0,
  alcohol: 0,
  medical_issues: 'none',
  hairfall_years: 5,
  hair_thinning_location: 'temples only, slightly pushed back',
  family_history_father: 1,
  family_history_maternal_grandfather: 1,
  skin_type: 'mostly oily',
  skin_concerns: 'mild dehydration, slight uneven texture, mild oiliness in T-zone',
  goal_seriousness: 10,
  emotional_context: 'confidence impacted by temples; wants proactive strategy; avoid extreme meds initially',
  onboarding_complete: 0,
};

const DEFAULT_GOALS = {
  target_weight_min: 70,
  target_weight_max: 72,
  target_body_fat_min: 14,
  target_body_fat_max: 15,
  timeline_months: 6,
  calories_min: 2100,
  calories_max: 2200,
  protein_min: 150,
  protein_max: 160,
  fat_min: 65,
  fat_max: 70,
  carbs_min: 200,
  carbs_max: 220,
  steps_goal: 10000,
  incline_walk_min: 10,
};

const SKIN_AM_ITEMS = [
  { id: '1', name: 'Cleanser (oily-skin friendly)', done: false },
  { id: '2', name: 'Vitamin C serum (10-15%)', done: false },
  { id: '3', name: 'Lightweight gel moisturizer', done: false },
  { id: '4', name: 'Sunscreen SPF 50 (non-negotiable)', done: false },
];

const SKIN_PM_ITEMS = [
  { id: '1', name: 'Cleanser', done: false },
  { id: '2', name: 'Niacinamide 5%', done: false },
  { id: '3', name: 'Retinol serum 0.3% (2-3x/week initially)', done: false },
  { id: '4', name: 'Gel moisturizer', done: false },
];

const HAIR_ITEMS = [
  { id: '1', name: 'Ketoconazole 2% shampoo (2x/week, 4-5 min)', done: false },
  { id: '2', name: 'Gentle sulfate-free shampoo (other wash days)', done: false },
  { id: '3', name: 'Conditioner (mid-length to ends)', done: false },
  { id: '4', name: 'Microneedling 0.5mm temples (optional, weekly)', done: false },
];

const BEARD_ITEMS = [
  { id: '1', name: 'Beard oil (daily after shower)', done: false },
  { id: '2', name: 'Derma roller (optional, weekly)', done: false },
  { id: '3', name: 'Neckline clean, cheek line, trim', done: false },
];

const SUPPLEMENT_SCHEDULE = [
  { time: 'morning', items: ['Vitamin D3 2000 IU', 'Multivitamin', 'Omega-3 (2000mg EPA/DHA)', 'Spirulina 3-5g (optional)', 'Shilajit small dose'], optional: ['Spirulina'] },
  { time: 'post-workout', items: ['Whey protein 1 scoop', 'Creatine 5g'], optional: [] },
  { time: 'night', items: ['Magnesium glycinate 300-400mg', 'Ashwagandha 600mg', 'Zinc 15mg'], optional: [] },
  { time: 'anytime', items: ['Collagen peptides 10g', 'Biotin 5000 mcg'], optional: [] },
];

const RETINOL_SCHEDULE = {
  weeks1to4: '2-3 nights/week',
  afterWeek4: 'every other night if tolerated',
  sunscreenRequired: true,
};

const KETOCONAZOLE_SCHEDULE = {
  frequency: '2x/week',
  leaveOnMinutes: 4,
  otherWashDays: 'gentle sulfate-free 1-2x/week',
};

const MEAL_DAY_1 = [
  { meal: 'breakfast', items: '4 eggs, 40g oats, 1 banana' },
  { meal: 'lunch', items: '180g chicken breast, 150g cooked rice, vegetables' },
  { meal: 'post-workout', items: 'whey + 5g creatine' },
  { meal: 'dinner', items: '150g paneer, 1 roti, salad' },
];

const MEAL_DAY_2 = [
  { meal: 'breakfast', items: '3 eggs + 2 egg whites, whole wheat toast, fruit' },
  { meal: 'lunch', items: '150g grilled fish, 150g cooked rice, vegetables' },
  { meal: 'post-workout', items: 'whey + creatine' },
  { meal: 'dinner', items: '150g chicken, stir-fry vegetables' },
];

const MEAL_DAY_3 = [
  { meal: 'breakfast', items: '4 eggs, fruit' },
  { meal: 'lunch', items: '200g chicken, big salad, 100g cooked rice' },
  { meal: 'post-workout', items: 'whey' },
  { meal: 'dinner', items: '150g paneer, vegetables' },
];

const MEAL_DAY_4 = [
  { meal: 'breakfast', items: 'oats + whey mixed, 2 whole eggs' },
  { meal: 'lunch', items: '180g chicken, 2 rotis, vegetables' },
  { meal: 'post-workout', items: 'banana + creatine' },
  { meal: 'dinner', items: '150g fish, salad' },
];

const MEAL_DAY_5 = [
  { meal: 'breakfast', items: '4 eggs, 60g oats' },
  { meal: 'lunch', items: '200g chicken, 200g cooked rice, vegetables' },
  { meal: 'post-workout', items: 'whey + creatine' },
  { meal: 'dinner', items: '150g paneer, 1 roti' },
];

const MEAL_DAY_6 = [
  { meal: 'breakfast', items: '3 eggs + 3 egg whites' },
  { meal: 'lunch', items: '200g fish, vegetables, small rice portion' },
  { meal: 'post-workout', items: 'whey' },
  { meal: 'dinner', items: '150g chicken, salad' },
];

const MEAL_DAY_7 = [
  { meal: 'breakfast', items: 'vegetable omelette, toast' },
  { meal: 'lunch', items: 'homemade chicken curry, controlled rice portion' },
  { meal: 'post-workout', items: 'whey' },
  { meal: 'dinner', items: 'paneer OR fish, vegetables' },
];

const WORKOUT_DAY_1 = {
  name: 'Push (chest/shoulders/triceps)',
  exercises: [
    { name: 'Bench Press', sets: 3, reps: '8-12', notes: 'Progressive overload' },
    { name: 'Overhead Press', sets: 3, reps: '8-12' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: '8-12' },
    { name: 'Lateral Raises', sets: 3, reps: '8-12' },
    { name: 'Tricep Pushdowns', sets: 3, reps: '8-12' },
  ],
  optionalInclineWalk: '10-15 min post workout',
};

const WORKOUT_DAY_2 = {
  name: 'Pull (back/biceps)',
  exercises: [
    { name: 'Deadlift', sets: 3, reps: '8-12' },
    { name: 'Pull-ups/Lat Pulldown', sets: 3, reps: '8-12' },
    { name: 'Barbell Rows', sets: 3, reps: '8-12' },
    { name: 'Face Pulls', sets: 3, reps: '8-12' },
    { name: 'Barbell Curls', sets: 3, reps: '8-12' },
  ],
  optionalInclineWalk: '10-15 min post workout',
};

const WORKOUT_DAY_3 = {
  name: 'Legs',
  exercises: [
    { name: 'Squat', sets: 3, reps: '8-12' },
    { name: 'Romanian Deadlift', sets: 3, reps: '8-12' },
    { name: 'Leg Press', sets: 3, reps: '8-12' },
    { name: 'Leg Curls', sets: 3, reps: '8-12' },
    { name: 'Calf Raises', sets: 3, reps: '8-12' },
  ],
  optionalInclineWalk: '10-15 min post workout',
};

const WORKOUT_DAY_4 = {
  name: 'Upper Hypertrophy (chest + back pump + arms)',
  exercises: [
    { name: 'Cable Flyes', sets: 3, reps: '8-12' },
    { name: 'Cable Rows', sets: 3, reps: '8-12' },
    { name: 'Dumbbell Curls', sets: 3, reps: '8-12' },
    { name: 'Skull Crushers', sets: 3, reps: '8-12' },
  ],
  optionalInclineWalk: '10-15 min post workout',
};

const WORKOUT_DAY_5 = {
  name: 'Lower + Core',
  exercises: [
    { name: 'Front Squat/Leg Press', sets: 3, reps: '8-12' },
    { name: 'Bulgarian Split Squats', sets: 3, reps: '8-12' },
    { name: 'Leg Extensions', sets: 3, reps: '8-12' },
    { name: 'Planks', sets: 3, reps: '30-60 sec' },
    { name: 'Hanging Leg Raises', sets: 3, reps: '8-12' },
  ],
  optionalInclineWalk: '10-15 min post workout',
};

export async function seedTransformationData(): Promise<boolean> {
  const existing = await getTransformationProfile();
  if (existing) {
    return false;
  }

  const profileId = await createTransformationProfile(DEFAULT_PROFILE);

  await createTransformationGoals({
    ...DEFAULT_GOALS,
    profile_id: profileId,
  });

  await createTransformationRoutines({
    profile_id: profileId,
    skin_am_items: SKIN_AM_ITEMS,
    skin_pm_items: SKIN_PM_ITEMS,
    hair_items: HAIR_ITEMS,
    beard_items: BEARD_ITEMS,
    supplement_schedule: SUPPLEMENT_SCHEDULE,
    retinol_schedule: RETINOL_SCHEDULE,
    ketoconazole_schedule: KETOCONAZOLE_SCHEDULE,
  });

  await createMealPlan({
    profile_id: profileId,
    plan_name: '6-Month Recomp Meal Plan',
    day_1_meals: MEAL_DAY_1,
    day_2_meals: MEAL_DAY_2,
    day_3_meals: MEAL_DAY_3,
    day_4_meals: MEAL_DAY_4,
    day_5_meals: MEAL_DAY_5,
    day_6_meals: MEAL_DAY_6,
    day_7_meals: MEAL_DAY_7,
  });

  await createWorkoutPlan({
    profile_id: profileId,
    plan_name: '5-Day Recomp Split',
    day_1_exercises: WORKOUT_DAY_1,
    day_2_exercises: WORKOUT_DAY_2,
    day_3_exercises: WORKOUT_DAY_3,
    day_4_exercises: WORKOUT_DAY_4,
    day_5_exercises: WORKOUT_DAY_5,
  });

  // Default reminders
  await createTransformationReminder({
    reminder_type: 'sunscreen',
    time_of_day: '08:00',
    days_of_week: JSON.stringify([0, 1, 2, 3, 4, 5, 6]),
    frequency: 'daily',
  });
  await createTransformationReminder({
    reminder_type: 'retinol',
    time_of_day: '21:00',
    days_of_week: JSON.stringify([1, 3, 5]), // Tue, Thu, Sat - 2-3x/week
    frequency: '2-3x/week',
  });
  await createTransformationReminder({
    reminder_type: 'ketoconazole',
    time_of_day: '07:00',
    days_of_week: JSON.stringify([0, 3]), // Sun, Wed
    frequency: '2x/week',
  });
  await createTransformationReminder({
    reminder_type: 'microneedling',
    time_of_day: '20:00',
    days_of_week: JSON.stringify([0]), // Sunday
    frequency: 'weekly',
  });
  await createTransformationReminder({
    reminder_type: 'weigh_in',
    time_of_day: '07:00',
    days_of_week: JSON.stringify([0]), // Sunday
    frequency: 'weekly',
  });

  return true;
}

/**
 * Ensures a meal plan and workout plan exist for the current transformation profile.
 * Call after seedTransformationData so users who already had a profile (e.g. before
 * plans were added) get default plans and see "This week's plan" on the Plan tab.
 */
export async function ensureTransformationPlans(): Promise<void> {
  const profile = await getTransformationProfile();
  if (!profile?.id) return;

  const [existingMealPlan, existingWorkoutPlan] = await Promise.all([
    getMealPlan(profile.id),
    getWorkoutPlan(profile.id),
  ]);

  if (!existingMealPlan) {
    await createMealPlan({
      profile_id: profile.id,
      plan_name: '6-Month Recomp Meal Plan',
      day_1_meals: MEAL_DAY_1,
      day_2_meals: MEAL_DAY_2,
      day_3_meals: MEAL_DAY_3,
      day_4_meals: MEAL_DAY_4,
      day_5_meals: MEAL_DAY_5,
      day_6_meals: MEAL_DAY_6,
      day_7_meals: MEAL_DAY_7,
    });
  }

  if (!existingWorkoutPlan) {
    await createWorkoutPlan({
      profile_id: profile.id,
      plan_name: '5-Day Recomp Split',
      day_1_exercises: WORKOUT_DAY_1,
      day_2_exercises: WORKOUT_DAY_2,
      day_3_exercises: WORKOUT_DAY_3,
      day_4_exercises: WORKOUT_DAY_4,
      day_5_exercises: WORKOUT_DAY_5,
    });
  }
}
