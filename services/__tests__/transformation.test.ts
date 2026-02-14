/**
 * Unit tests for Transformation Tracker business logic
 */

import {
  getRetinolNightsThisWeek,
  isRetinolNightToday,
  getKetoconazoleDays,
  isKetoconazoleDay,
  getMicroneedlingDay,
  isMicroneedlingDay,
  getMealPlanDayIndex,
  getWorkoutDayIndex,
  canLogHairlineCheck,
  checkWeightPlateau,
  HABIT_CATEGORIES,
  getCategoryCompletion,
} from '../transformation';
import * as db from '../db';

jest.mock('../db');

describe('Retinol scheduling', () => {
  it('returns Tue/Thu/Sat for weeks 1-4', () => {
    const nights = getRetinolNightsThisWeek(1);
    expect(nights).toContain(1);
    expect(nights).toContain(3);
    expect(nights).toContain(5);
    expect(nights).toHaveLength(3);
  });

  it('returns every other night for week 5+', () => {
    const nights = getRetinolNightsThisWeek(5);
    expect(nights).toContain(0);
    expect(nights).toContain(2);
    expect(nights).toContain(4);
    expect(nights).toContain(6);
    expect(nights).toHaveLength(4);
  });

  it('isRetinolNightToday returns boolean', () => {
    const result = isRetinolNightToday();
    expect(typeof result).toBe('boolean');
  });
});

describe('Ketoconazole schedule', () => {
  it('returns Sunday and Wednesday', () => {
    const days = getKetoconazoleDays();
    expect(days).toContain(0);
    expect(days).toContain(3);
    expect(days).toHaveLength(2);
  });

  it('isKetoconazoleDay returns boolean for given date', () => {
    const sunday = new Date('2025-02-16').getTime();
    const monday = new Date('2025-02-17').getTime();
    expect(isKetoconazoleDay(sunday)).toBe(true);
    expect(isKetoconazoleDay(monday)).toBe(false);
  });
});

describe('Meal plan rotation', () => {
  it('getMealPlanDayIndex returns 1-7 for any date', () => {
    const sunday = new Date('2025-02-16').getTime();
    const monday = new Date('2025-02-17').getTime();
    expect(getMealPlanDayIndex(sunday)).toBe(1);
    expect(getMealPlanDayIndex(monday)).toBe(2);
  });
});

describe('Workout day index', () => {
  it('returns 1-5 for weekdays, 0 for weekend', () => {
    const monday = new Date('2025-02-17').getTime();
    const saturday = new Date('2025-02-15').getTime();
    expect(getWorkoutDayIndex(monday)).toBe(1);
    expect(getWorkoutDayIndex(saturday)).toBe(0);
  });
});

describe('Hairline check restriction', () => {
  it('allows when no previous check', async () => {
    (db.getLastHairlineCheck as jest.Mock).mockResolvedValue(null);
    const result = await canLogHairlineCheck();
    expect(result.allowed).toBe(true);
    expect(result.daysSinceLast).toBeNull();
  });

  it('warns when last check was < 28 days ago', async () => {
    const twentyDaysAgo = Date.now() - 20 * 24 * 60 * 60 * 1000;
    (db.getLastHairlineCheck as jest.Mock).mockResolvedValue({
      check_date: twentyDaysAgo,
    });
    const result = await canLogHairlineCheck();
    expect(result.allowed).toBe(false);
    expect(result.daysSinceLast).toBeGreaterThanOrEqual(19);
    expect(result.message).toContain('4-6 weeks');
  });

  it('allows when last check was 28+ days ago', async () => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    (db.getLastHairlineCheck as jest.Mock).mockResolvedValue({
      check_date: thirtyDaysAgo,
    });
    const result = await canLogHairlineCheck();
    expect(result.allowed).toBe(true);
  });
});

describe('Weight plateau detection', () => {
  it('returns isPlateau false when insufficient data', async () => {
    (db.getWeeklyCheckins as jest.Mock).mockResolvedValue([]);
    const result = await checkWeightPlateau();
    expect(result.isPlateau).toBe(false);
    expect(result.suggestion).toBeNull();
  });

  it('returns isPlateau true when weight unchanged for 2 weeks', async () => {
    const now = Date.now();
    (db.getWeeklyCheckins as jest.Mock).mockResolvedValue([
      { weight_kg: 78, checkin_date: now },
      { weight_kg: 78, checkin_date: now - 7 * 86400000 },
      { weight_kg: 78, checkin_date: now - 14 * 86400000 },
      { weight_kg: 78, checkin_date: now - 21 * 86400000 },
    ]);
    const result = await checkWeightPlateau();
    expect(result.isPlateau).toBe(true);
    expect(result.suggestion).toContain('reducing carbs');
  });
});

describe('Microneedling schedule', () => {
  it('returns Sunday (0) as microneedling day', () => {
    expect(getMicroneedlingDay()).toBe(0);
  });
  it('isMicroneedlingDay true on Sunday', () => {
    const sunday = new Date('2025-02-16').getTime();
    expect(isMicroneedlingDay(sunday)).toBe(true);
  });
  it('isMicroneedlingDay false on Monday', () => {
    const monday = new Date('2025-02-17').getTime();
    expect(isMicroneedlingDay(monday)).toBe(false);
  });
});

describe('Habit categories', () => {
  it('HABIT_CATEGORIES has skin_am, skin_pm, hair, supplements, activity', () => {
    expect(HABIT_CATEGORIES.skin_am.label).toBe('Skin (AM)');
    expect(HABIT_CATEGORIES.hair.checklistFields).toContain('ketoconazole_done');
  });
  it('getCategoryCompletion returns done/total for category', () => {
    const checklist = { skin_am_done: 1, sunscreen_done: 1 };
    const r = getCategoryCompletion(checklist as any, 'skin_am');
    expect(r.done).toBe(2);
    expect(r.total).toBe(2);
  });
  it('getCategoryCompletion returns 0/total when checklist null', () => {
    const r = getCategoryCompletion(null, 'supplements');
    expect(r.done).toBe(0);
    expect(r.total).toBe(3);
  });
});
