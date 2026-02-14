// src/services/db.ts
import * as SQLite from 'expo-sqlite';
import { getTodayStepCount } from './steps';

const db = SQLite.openDatabaseSync('health.db');

// Lightweight UUID v4 generator that doesn't rely on crypto.getRandomValues
function generateId(): string {
  // Good enough for a local-only health log; not for cryptographic use.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function initDb() {
  try {
    // Blood pressure readings
    db.execSync(`
      CREATE TABLE IF NOT EXISTS bp_readings (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        systolic INTEGER NOT NULL,
        diastolic INTEGER NOT NULL,
        pulse INTEGER,
        cuff_location TEXT DEFAULT 'arm',
        posture TEXT DEFAULT 'sitting',
        note TEXT,
        measured_at INTEGER NOT NULL,
        source TEXT DEFAULT 'manual',
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Migraine events (ICHD-3 aligned comprehensive tracking)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS migraine_readings (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        
        -- Timing & Status
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        is_ongoing INTEGER DEFAULT 1,
        is_completed INTEGER DEFAULT 0,
        time_to_peak TEXT,
        
        -- Sleep Data (Previous Night)
        sleep_hours TEXT,
        sleep_quality TEXT,
        had_nap INTEGER DEFAULT 0,
        nap_duration TEXT,
        
        -- Hydration (24hrs before)
        fluid_intake_oz TEXT,
        was_dehydrated INTEGER DEFAULT 0,
        
        -- Pain characteristics (ICHD-3 criteria)
        severity INTEGER NOT NULL CHECK (severity >= 0 AND severity <= 10),
        pain_locations TEXT,
        pain_laterality TEXT,
        pain_quality TEXT,
        worsened_by_movement INTEGER,
        
        -- Aura
        aura_present INTEGER,
        aura_types TEXT,
        aura_duration TEXT,
        
        -- Associated symptoms (ICHD-3 criteria)
        nausea INTEGER DEFAULT 0,
        vomiting INTEGER DEFAULT 0,
        photophobia INTEGER DEFAULT 0,
        phonophobia INTEGER DEFAULT 0,
        other_symptoms TEXT,
        
        -- Phases
        prodrome_symptoms TEXT,
        postdrome_symptoms TEXT,
        
        -- Triggers
        triggers TEXT,
        food_triggers TEXT,
        menstrual_related INTEGER,
        weather_related INTEGER,
        
        -- Enhanced Medication Tracking
        took_medication INTEGER,
        medications TEXT,
        relief_at_30min TEXT,
        relief_at_1hr TEXT,
        relief_at_2hr TEXT,
        relief_at_4hr TEXT,
        
        -- Disability & Function
        functional_impact TEXT,
        could_work INTEGER,
        bed_bound_hours TEXT,
        
        -- MIDAS Assessment
        midas_data TEXT,
        midas_score INTEGER,
        midas_grade TEXT,
        
        -- Classification
        migraine_classification TEXT,
        migraine_type TEXT,
        meets_ichd3_criteria INTEGER,
        ichd3_criteria_count INTEGER,
        headache_days_30 INTEGER,
        migraine_days_30 INTEGER,
        
        -- Notes
        note TEXT,
        
        -- Legacy fields (for backward compatibility)
        pain_location TEXT,
        symptoms TEXT,
        medication_details TEXT,
        medication_timing TEXT,
        relief_achieved TEXT,
        disability_level TEXT,
        
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Steps tracking
    db.execSync(`
      CREATE TABLE IF NOT EXISTS steps (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        steps INTEGER NOT NULL,
        date INTEGER NOT NULL,
        source TEXT DEFAULT 'manual',
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Workouts
    db.execSync(`
      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        workout_type TEXT NOT NULL,
        duration INTEGER NOT NULL,
        intensity TEXT,
        calories_burned INTEGER,
        note TEXT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Meals
    db.execSync(`
      CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        meal_type TEXT NOT NULL,
        food_items TEXT,
        calories INTEGER,
        note TEXT,
        consumed_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Medications (enhanced for tracking)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS medications (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        notes TEXT,
        start_date INTEGER NOT NULL,
        end_date INTEGER,
        is_active INTEGER DEFAULT 1,
        prescribing_doctor TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Medication logs
    db.execSync(`
      CREATE TABLE IF NOT EXISTS medication_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        medication_id TEXT,
        medication_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        note TEXT,
        taken_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (medication_id) REFERENCES medications (id)
      );
    `);

    // Meditation routines (for tracking daily meditation goals)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS meditation_routines (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        name TEXT NOT NULL,
        target_minutes INTEGER DEFAULT 10,
        notes TEXT,
        start_date INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Meditation sessions (individual logs)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS meditation_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        routine_id TEXT,
        duration INTEGER NOT NULL,
        meditation_type TEXT,
        note TEXT,
        session_date INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (routine_id) REFERENCES meditation_routines (id)
      );
    `);

    // Supplements (enhanced for tracking)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS supplements (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        notes TEXT,
        start_date INTEGER NOT NULL,
        end_date INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Supplement logs
    db.execSync(`
      CREATE TABLE IF NOT EXISTS supplement_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        supplement_id TEXT,
        supplement_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        note TEXT,
        taken_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (supplement_id) REFERENCES supplements (id)
      );
    `);

    // Journal entries (enhanced for comprehensive state tracking)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS journals (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        entry_date INTEGER NOT NULL,
        mood TEXT,
        mood_intensity INTEGER CHECK (mood_intensity >= 1 AND mood_intensity <= 10),
        energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
        stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
        sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
        sleep_hours REAL,
        physical_symptoms TEXT,
        social_activity TEXT,
        exercise_duration INTEGER,
        exercise_type TEXT,
        nutrition_quality INTEGER CHECK (nutrition_quality >= 1 AND nutrition_quality <= 10),
        hydration_glasses INTEGER,
        weather TEXT,
        location TEXT,
        gratitude TEXT,
        goals_achieved TEXT,
        challenges TEXT,
        note TEXT,
        photo_uri TEXT,
        photo_asset_id TEXT,
        tags TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Sleep tracking
    db.execSync(`
      CREATE TABLE IF NOT EXISTS sleep_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        sleep_date INTEGER NOT NULL,
        bedtime INTEGER,
        wake_time INTEGER,
        sleep_duration INTEGER,
        sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
        note TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Dose schedules (for medications and supplements)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS dose_schedules (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        parent_type TEXT NOT NULL CHECK (parent_type IN ('medication', 'supplement')),
        parent_id TEXT NOT NULL,
        time_of_day TEXT NOT NULL,
        days_of_week TEXT NOT NULL,
        dosage TEXT,
        instructions TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (parent_id) REFERENCES medications (id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES supplements (id) ON DELETE CASCADE
      );
    `);

    // Tracking events (unified tracking for all items)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS tracking_events (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        parent_type TEXT NOT NULL CHECK (parent_type IN ('medication', 'supplement', 'meditation', 'appointment')),
        parent_id TEXT NOT NULL,
        schedule_id TEXT,
        event_type TEXT NOT NULL CHECK (event_type IN ('taken', 'done', 'skipped', 'missed')),
        event_date INTEGER NOT NULL,
        event_time INTEGER,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Appointments (doctor visits and follow-ups)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        doctor_name TEXT NOT NULL,
        specialty TEXT,
        location TEXT,
        appointment_date INTEGER NOT NULL,
        appointment_type TEXT DEFAULT 'visit' CHECK (appointment_type IN ('visit', 'followup')),
        notes TEXT,
        is_completed INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Meta sync for backup
    db.execSync(`
      CREATE TABLE IF NOT EXISTS meta_sync (
        id TEXT PRIMARY KEY,
        last_sync INTEGER,
        sync_status TEXT DEFAULT 'pending',
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // AILY private blog entries (simplified journal with photo + letter)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS aily_blogs (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        entry_date INTEGER NOT NULL,
        photo_uri TEXT,
        photo_asset_id TEXT,
        letter TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // ========== Transformation Tracker Tables ==========

    // Transformation profiles (user demographics, health metrics)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS transformation_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        age INTEGER,
        sex TEXT,
        height_cm REAL,
        weight_kg REAL,
        body_fat_pct REAL,
        diet TEXT,
        training_frequency TEXT,
        sleep_hours TEXT,
        smoking INTEGER DEFAULT 0,
        alcohol INTEGER DEFAULT 0,
        medical_issues TEXT,
        hairfall_years INTEGER,
        hair_thinning_location TEXT,
        family_history_father INTEGER DEFAULT 0,
        family_history_maternal_grandfather INTEGER DEFAULT 0,
        skin_type TEXT,
        skin_concerns TEXT,
        goal_seriousness INTEGER,
        emotional_context TEXT,
        onboarding_complete INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Transformation goals (targets, macros, timeline)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS transformation_goals (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        profile_id TEXT,
        target_weight_min REAL,
        target_weight_max REAL,
        target_body_fat_min REAL,
        target_body_fat_max REAL,
        timeline_months INTEGER,
        calories_min INTEGER,
        calories_max INTEGER,
        protein_min INTEGER,
        protein_max INTEGER,
        fat_min INTEGER,
        fat_max INTEGER,
        carbs_min INTEGER,
        carbs_max INTEGER,
        steps_goal INTEGER,
        incline_walk_min INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (profile_id) REFERENCES transformation_profiles (id)
      );
    `);

    // Transformation routines (skincare AM/PM, hair, beard - JSON structure)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS transformation_routines (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        profile_id TEXT,
        skin_am_items TEXT,
        skin_pm_items TEXT,
        hair_items TEXT,
        beard_items TEXT,
        supplement_schedule TEXT,
        retinol_schedule TEXT,
        ketoconazole_schedule TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (profile_id) REFERENCES transformation_profiles (id)
      );
    `);

    // Meal plans (7-day rotating template)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS meal_plans (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        profile_id TEXT,
        plan_name TEXT,
        day_1_meals TEXT,
        day_2_meals TEXT,
        day_3_meals TEXT,
        day_4_meals TEXT,
        day_5_meals TEXT,
        day_6_meals TEXT,
        day_7_meals TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (profile_id) REFERENCES transformation_profiles (id)
      );
    `);

    // Meal plan adherence (daily tracking with swaps)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS meal_plan_adherence (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        meal_plan_id TEXT,
        adherence_date INTEGER NOT NULL,
        day_of_week INTEGER,
        breakfast_completed INTEGER DEFAULT 0,
        lunch_completed INTEGER DEFAULT 0,
        post_workout_completed INTEGER DEFAULT 0,
        dinner_completed INTEGER DEFAULT 0,
        swaps TEXT,
        notes TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (meal_plan_id) REFERENCES meal_plans (id)
      );
    `);

    // Workout plans (5-day split template)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS workout_plans (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        profile_id TEXT,
        plan_name TEXT,
        day_1_exercises TEXT,
        day_2_exercises TEXT,
        day_3_exercises TEXT,
        day_4_exercises TEXT,
        day_5_exercises TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (profile_id) REFERENCES transformation_profiles (id)
      );
    `);

    // Workout logs (enhanced: sets, reps, weights)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        workout_plan_id TEXT,
        workout_type TEXT NOT NULL,
        day_number INTEGER,
        exercises_data TEXT,
        duration INTEGER NOT NULL,
        incline_walk_minutes INTEGER,
        intensity TEXT,
        calories_burned INTEGER,
        note TEXT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (workout_plan_id) REFERENCES workout_plans (id)
      );
    `);

    // Weekly check-ins (weigh-in, measurements, adherence)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS weekly_checkins (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        checkin_date INTEGER NOT NULL,
        weight_kg REAL,
        waist_cm REAL,
        body_fat_pct REAL,
        strength_prs TEXT,
        adherence_pct INTEGER,
        notes TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (user_id) REFERENCES transformation_profiles (user_id)
      );
    `);

    // Progress photos metadata (monthly checkpoints)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS progress_photos_meta (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        photo_date INTEGER NOT NULL,
        lighting_notes TEXT,
        angles TEXT,
        notes TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Hairline checks (4-6 week interval enforcement)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS hairline_checks (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        check_date INTEGER NOT NULL,
        notes TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Transformation reminders (sunscreen, retinol, ketoconazole, etc.)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS transformation_reminders (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        reminder_type TEXT NOT NULL,
        time_of_day TEXT,
        days_of_week TEXT,
        frequency TEXT,
        is_enabled INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Routine checklists (daily checklist completion)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS routine_checklists (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        checklist_date INTEGER NOT NULL,
        skin_am_done INTEGER DEFAULT 0,
        skin_pm_done INTEGER DEFAULT 0,
        sunscreen_done INTEGER DEFAULT 0,
        retinol_done INTEGER DEFAULT 0,
        hair_wash_done INTEGER DEFAULT 0,
        conditioner_done INTEGER DEFAULT 0,
        beard_oil_done INTEGER DEFAULT 0,
        supplements_morning_done INTEGER DEFAULT 0,
        supplements_postworkout_done INTEGER DEFAULT 0,
        supplements_night_done INTEGER DEFAULT 0,
        steps_done INTEGER DEFAULT 0,
        steps_count INTEGER,
        workout_done INTEGER DEFAULT 0,
        ketoconazole_done INTEGER DEFAULT 0,
        microneedling_done INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Transformation Tracker indexes
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_weekly_checkins_date ON weekly_checkins(checkin_date);`);

    // Migration: workout_logs - add split_tag, progressive_overload, is_leg_day
    try {
      const wlCols = db.getAllSync(`PRAGMA table_info(workout_logs)`);
      const wlNames = (wlCols as any[]).map((c) => c.name);
      if (!wlNames.includes('split_tag')) {
        db.execSync(`ALTER TABLE workout_logs ADD COLUMN split_tag TEXT;`);
        db.execSync(`ALTER TABLE workout_logs ADD COLUMN progressive_overload INTEGER DEFAULT 0;`);
        db.execSync(`ALTER TABLE workout_logs ADD COLUMN is_leg_day INTEGER DEFAULT 0;`);
      }
    } catch (_) {}

    // Migration: meal_plan_adherence - add protein_grams for protein compliance
    try {
      const mpaCols = db.getAllSync(`PRAGMA table_info(meal_plan_adherence)`);
      const mpaNames = (mpaCols as any[]).map((c) => c.name);
      if (!mpaNames.includes('protein_grams')) {
        db.execSync(`ALTER TABLE meal_plan_adherence ADD COLUMN protein_grams INTEGER;`);
      }
    } catch (_) {}
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_progress_photos_date ON progress_photos_meta(photo_date);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_hairline_checks_date ON hairline_checks(check_date);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_meal_plan_adherence_date ON meal_plan_adherence(adherence_date);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_routine_checklists_date ON routine_checklists(checklist_date);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_workout_logs_started ON workout_logs(started_at);`);

    // Migrate existing tables - add new columns if they don't exist
    try {
      // Check if medications table exists and has start_date column
      const tables = db.getAllSync(`SELECT name FROM sqlite_master WHERE type='table' AND name='medications'`);
      if (tables.length > 0) {
        const medColumns = db.getAllSync(`PRAGMA table_info(medications)`);
        const hasStartDate = medColumns.some((col: any) => col.name === 'start_date');
        if (!hasStartDate) {
          db.execSync(`ALTER TABLE medications ADD COLUMN start_date INTEGER;`);
          db.execSync(`ALTER TABLE medications ADD COLUMN notes TEXT;`);
          db.execSync(`ALTER TABLE medications ADD COLUMN end_date INTEGER;`);
          db.execSync(`ALTER TABLE medications ADD COLUMN prescribing_doctor TEXT;`);
          // Update existing rows to have start_date = created_at
          db.execSync(`UPDATE medications SET start_date = created_at WHERE start_date IS NULL;`);
        }
      }
    } catch (error) {
      // Migration for medications table
    }

    try {
      // Check if supplements table exists and has start_date column
      const tables = db.getAllSync(`SELECT name FROM sqlite_master WHERE type='table' AND name='supplements'`);
      if (tables.length > 0) {
        const suppColumns = db.getAllSync(`PRAGMA table_info(supplements)`);
        const hasStartDate = suppColumns.some((col: any) => col.name === 'start_date');
        if (!hasStartDate) {
          db.execSync(`ALTER TABLE supplements ADD COLUMN start_date INTEGER;`);
          db.execSync(`ALTER TABLE supplements ADD COLUMN notes TEXT;`);
          db.execSync(`ALTER TABLE supplements ADD COLUMN end_date INTEGER;`);
          // Update existing rows
          db.execSync(`UPDATE supplements SET start_date = created_at WHERE start_date IS NULL;`);
        }
      }
    } catch (error) {
      // Migration for supplements table
    }

    try {
      // Check if meditation_routines table exists
      const routinesCheck = db.getAllSync(`SELECT name FROM sqlite_master WHERE type='table' AND name='meditation_routines'`);
      if (routinesCheck.length === 0) {
        // Table doesn't exist, it will be created above
      } else {
        // Table exists, check if it has start_date
        const routineColumns = db.getAllSync(`PRAGMA table_info(meditation_routines)`);
        const hasStartDate = routineColumns.some((col: any) => col.name === 'start_date');
        if (!hasStartDate) {
          db.execSync(`ALTER TABLE meditation_routines ADD COLUMN start_date INTEGER;`);
          db.execSync(`UPDATE meditation_routines SET start_date = created_at WHERE start_date IS NULL;`);
        }
      }
    } catch (error) {
      // Migration for meditation_routines table
    }

    try {
      // Migrate meditation_sessions to add routine_id if it doesn't exist
      const sessionColumns = db.getAllSync(`PRAGMA table_info(meditation_sessions)`);
      const hasRoutineId = sessionColumns.some((col: any) => col.name === 'routine_id');
      if (!hasRoutineId) {
        db.execSync(`ALTER TABLE meditation_sessions ADD COLUMN routine_id TEXT;`);
      }
    } catch (error) {
      // Migration for meditation_sessions table
    }

    try {
      // Migrate journals table to add new comprehensive fields
      const tables = db.getAllSync(`SELECT name FROM sqlite_master WHERE type='table' AND name='journals'`);
      if (tables.length > 0) {
        const journalColumns = db.getAllSync(`PRAGMA table_info(journals)`);
        const columnNames = journalColumns.map((col: any) => col.name);
        
        const newColumns = [
          { name: 'mood_intensity', type: 'INTEGER' },
          { name: 'stress_level', type: 'INTEGER' },
          { name: 'sleep_quality', type: 'INTEGER' },
          { name: 'sleep_hours', type: 'REAL' },
          { name: 'physical_symptoms', type: 'TEXT' },
          { name: 'social_activity', type: 'TEXT' },
          { name: 'exercise_duration', type: 'INTEGER' },
          { name: 'exercise_type', type: 'TEXT' },
          { name: 'nutrition_quality', type: 'INTEGER' },
          { name: 'hydration_glasses', type: 'INTEGER' },
          { name: 'weather', type: 'TEXT' },
          { name: 'location', type: 'TEXT' },
          { name: 'gratitude', type: 'TEXT' },
          { name: 'goals_achieved', type: 'TEXT' },
          { name: 'challenges', type: 'TEXT' },
          { name: 'photo_uri', type: 'TEXT' },
          { name: 'photo_asset_id', type: 'TEXT' },
        ];
        
        for (const col of newColumns) {
          if (!columnNames.includes(col.name)) {
            try {
              db.execSync(`ALTER TABLE journals ADD COLUMN ${col.name} ${col.type};`);
            } catch (err) {
              // Error adding column
            }
          }
        }
      }
    } catch (error) {
      // Migration for journals table
    }

    try {
      // Migrate migraine_readings table to add all enhanced tracking fields
      const tables = db.getAllSync(`SELECT name FROM sqlite_master WHERE type='table' AND name='migraine_readings'`);
      if (tables.length > 0) {
        const migraineColumns = db.getAllSync(`PRAGMA table_info(migraine_readings)`);
        const columnNames = migraineColumns.map((col: any) => col.name);
        
        const newColumns = [
          // Status & Timing
          { name: 'is_ongoing', type: 'INTEGER DEFAULT 1' },
          { name: 'is_completed', type: 'INTEGER DEFAULT 0' },
          { name: 'time_to_peak', type: 'TEXT' },
          
          // Sleep Data
          { name: 'sleep_hours', type: 'TEXT' },
          { name: 'sleep_quality', type: 'TEXT' },
          { name: 'had_nap', type: 'INTEGER DEFAULT 0' },
          { name: 'nap_duration', type: 'TEXT' },
          
          // Hydration
          { name: 'fluid_intake_oz', type: 'TEXT' },
          { name: 'was_dehydrated', type: 'INTEGER DEFAULT 0' },
          
          // Pain characteristics (original fields)
          { name: 'pain_location', type: 'TEXT' },
          { name: 'pain_locations', type: 'TEXT' },
          { name: 'pain_laterality', type: 'TEXT' },
          { name: 'pain_quality', type: 'TEXT' },
          { name: 'worsened_by_movement', type: 'INTEGER' },
          
          // Aura
          { name: 'aura_present', type: 'INTEGER' },
          { name: 'aura_types', type: 'TEXT' },
          { name: 'aura_duration', type: 'TEXT' },
          
          // Associated symptoms
          { name: 'nausea', type: 'INTEGER DEFAULT 0' },
          { name: 'vomiting', type: 'INTEGER DEFAULT 0' },
          { name: 'photophobia', type: 'INTEGER DEFAULT 0' },
          { name: 'phonophobia', type: 'INTEGER DEFAULT 0' },
          { name: 'other_symptoms', type: 'TEXT' },
          
          // Phases
          { name: 'prodrome_symptoms', type: 'TEXT' },
          { name: 'postdrome_symptoms', type: 'TEXT' },
          
          // Triggers
          { name: 'food_triggers', type: 'TEXT' },
          { name: 'menstrual_related', type: 'INTEGER' },
          { name: 'weather_related', type: 'INTEGER' },
          
          // Medication (legacy and new)
          { name: 'took_medication', type: 'INTEGER' },
          { name: 'medication_details', type: 'TEXT' },
          { name: 'medication_timing', type: 'TEXT' },
          { name: 'medications', type: 'TEXT' },
          { name: 'relief_achieved', type: 'TEXT' },
          { name: 'relief_at_30min', type: 'TEXT' },
          { name: 'relief_at_1hr', type: 'TEXT' },
          { name: 'relief_at_2hr', type: 'TEXT' },
          { name: 'relief_at_4hr', type: 'TEXT' },
          
          // Disability & Function
          { name: 'disability_level', type: 'TEXT' },
          { name: 'functional_impact', type: 'TEXT' },
          { name: 'could_work', type: 'INTEGER' },
          { name: 'bed_bound_hours', type: 'TEXT' },
          
          // MIDAS
          { name: 'midas_data', type: 'TEXT' },
          { name: 'midas_score', type: 'INTEGER' },
          { name: 'midas_grade', type: 'TEXT' },
          
          // Classification
          { name: 'migraine_classification', type: 'TEXT' },
          { name: 'migraine_type', type: 'TEXT' },
          { name: 'meets_ichd3_criteria', type: 'INTEGER' },
          { name: 'ichd3_criteria_count', type: 'INTEGER' },
          { name: 'headache_days_30', type: 'INTEGER' },
          { name: 'migraine_days_30', type: 'INTEGER' },
        ];
        
        for (const col of newColumns) {
          if (!columnNames.includes(col.name)) {
            try {
              db.execSync(`ALTER TABLE migraine_readings ADD COLUMN ${col.name} ${col.type};`);
            } catch (err) {
              // Error adding migraine column
            }
          }
        }
      }
    } catch (error) {
      // Migration for migraine_readings table
    }

    // Create indexes for better performance
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_bp_readings_measured_at ON bp_readings(measured_at);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_migraine_started_at ON migraine_readings(started_at);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_steps_date ON steps(date);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_medication_logs_taken_at ON medication_logs(taken_at);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_supplement_logs_taken_at ON supplement_logs(taken_at);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_journals_entry_date ON journals(entry_date);`);
    
    try {
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active, start_date);`);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_supplements_active ON supplements(is_active, start_date);`);
    } catch (error) {
      // Indexes might fail if columns don't exist yet, that's okay
    }
    
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_dose_schedules_parent ON dose_schedules(parent_type, parent_id);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_tracking_events_parent ON tracking_events(parent_type, parent_id, event_date);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date, is_completed);`);

    // Database initialized successfully
  } catch (error) {
    // Error initializing database
  }
}

export function saveBPReading(reading: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const id = reading.id || generateId();
      const userId = reading.user_id || 'local-user';
      
      db.runSync(
        `INSERT INTO bp_readings (id, user_id, systolic, diastolic, pulse, cuff_location, posture, note, measured_at, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          reading.systolic,
          reading.diastolic,
          reading.pulse,
          reading.cuff_location || 'arm',
          reading.posture || 'sitting',
          reading.note || '',
          reading.measured_at || Date.now(),
          reading.source || 'manual',
        ]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function getLatestBP(): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getFirstSync(
        `SELECT * FROM bp_readings ORDER BY measured_at DESC LIMIT 1`
      );
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function saveMedicationLog(log: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const id = log.id || generateId();
      const userId = log.user_id || 'local-user';
      
      db.runSync(
        `INSERT INTO medication_logs (id, user_id, medication_name, dosage, note, taken_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          log.medication_name,
          log.dosage,
          log.note || '',
          log.taken_at || Date.now(),
        ]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function getMedicationLogs(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM medication_logs ORDER BY taken_at DESC`
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getSupplementLogs(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM supplement_logs ORDER BY taken_at DESC`
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function saveSupplementLog(log: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const id = log.id || generateId();
      const userId = log.user_id || 'local-user';
      
      db.runSync(
        `INSERT INTO supplement_logs (id, user_id, supplement_name, dosage, note, taken_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          log.supplement_name,
          log.dosage,
          log.note || '',
          log.taken_at || Date.now(),
        ]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function getMeditationLogs(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM meditation_sessions ORDER BY session_date DESC`
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function saveMeditationLog(log: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const id = log.id || generateId();
      const userId = log.user_id || 'local-user';
      
      db.runSync(
        `INSERT INTO meditation_sessions (id, user_id, duration, meditation_type, note, session_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          log.duration,
          log.meditation_type || 'mindfulness',
          log.note || '',
          log.session_date || Date.now(),
        ]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function saveMigraineReading(reading: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const id = reading.id || generateId();
      const userId = reading.user_id || 'local-user';
      
      db.runSync(
        `INSERT INTO migraine_readings (
          id, user_id, started_at, ended_at, is_ongoing, is_completed, time_to_peak,
          sleep_hours, sleep_quality, had_nap, nap_duration,
          fluid_intake_oz, was_dehydrated,
          severity, pain_locations, pain_laterality, pain_quality, worsened_by_movement,
          aura_present, aura_types, aura_duration,
          nausea, vomiting, photophobia, phonophobia, other_symptoms,
          prodrome_symptoms, postdrome_symptoms,
          triggers, food_triggers, menstrual_related, weather_related,
          took_medication, medications, relief_at_30min, relief_at_1hr, relief_at_2hr, relief_at_4hr,
          functional_impact, could_work, bed_bound_hours,
          midas_data, midas_score, midas_grade,
          migraine_classification, migraine_type, meets_ichd3_criteria, ichd3_criteria_count,
          headache_days_30, migraine_days_30,
          note,
          pain_location, symptoms, medication_details, medication_timing, relief_achieved, disability_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          reading.started_at || Date.now(),
          reading.ended_at || null,
          reading.is_ongoing ? 1 : 0,
          reading.is_completed ? 1 : 0,
          reading.time_to_peak || null,
          
          // Sleep data
          reading.sleep_hours || null,
          reading.sleep_quality || null,
          reading.had_nap ? 1 : 0,
          reading.nap_duration || null,
          
          // Hydration
          reading.fluid_intake_oz || null,
          reading.was_dehydrated ? 1 : 0,
          
          // Pain characteristics
          reading.severity,
          reading.pain_locations || null,
          reading.pain_laterality || null,
          reading.pain_quality || null,
          reading.worsened_by_movement !== null && reading.worsened_by_movement !== undefined 
            ? (reading.worsened_by_movement ? 1 : 0) : null,
          
          // Aura
          reading.aura_present !== null && reading.aura_present !== undefined 
            ? (reading.aura_present ? 1 : 0) : null,
          reading.aura_types || null,
          reading.aura_duration || null,
          
          // Associated symptoms
          reading.nausea ? 1 : 0,
          reading.vomiting ? 1 : 0,
          reading.photophobia ? 1 : 0,
          reading.phonophobia ? 1 : 0,
          reading.other_symptoms || null,
          
          // Phases
          reading.prodrome_symptoms || null,
          reading.postdrome_symptoms || null,
          
          // Triggers
          reading.triggers || null,
          reading.food_triggers || null,
          reading.menstrual_related !== null && reading.menstrual_related !== undefined 
            ? (reading.menstrual_related ? 1 : 0) : null,
          reading.weather_related !== null && reading.weather_related !== undefined 
            ? (reading.weather_related ? 1 : 0) : null,
          
          // Medication
          reading.took_medication !== null && reading.took_medication !== undefined 
            ? (reading.took_medication ? 1 : 0) : null,
          reading.medications || null,
          reading.relief_at_30min || null,
          reading.relief_at_1hr || null,
          reading.relief_at_2hr || null,
          reading.relief_at_4hr || null,
          
          // Disability & Function
          reading.functional_impact || null,
          reading.could_work !== null && reading.could_work !== undefined 
            ? (reading.could_work ? 1 : 0) : null,
          reading.bed_bound_hours || null,
          
          // MIDAS
          reading.midas_data || null,
          reading.midas_score || null,
          reading.midas_grade || null,
          
          // Classification
          reading.migraine_classification || null,
          reading.migraine_type || null,
          reading.meets_ichd3_criteria !== null && reading.meets_ichd3_criteria !== undefined 
            ? (reading.meets_ichd3_criteria ? 1 : 0) : null,
          reading.ichd3_criteria_count || null,
          reading.headache_days_30 || null,
          reading.migraine_days_30 || null,
          
          // Notes
          reading.note || null,
          
          // Legacy fields (for backward compatibility)
          reading.pain_location || null,
          reading.symptoms || null,
          reading.medication_details || null,
          reading.medication_timing || null,
          reading.relief_achieved || null,
          reading.disability_level || null,
        ]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function updateMigraineReading(id: string, updates: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      db.runSync(
        `UPDATE migraine_readings SET
          started_at = ?,
          ended_at = ?,
          is_ongoing = ?,
          is_completed = ?,
          time_to_peak = ?,
          sleep_hours = ?,
          sleep_quality = ?,
          had_nap = ?,
          nap_duration = ?,
          fluid_intake_oz = ?,
          was_dehydrated = ?,
          severity = ?,
          pain_locations = ?,
          pain_laterality = ?,
          pain_quality = ?,
          worsened_by_movement = ?,
          aura_present = ?,
          aura_types = ?,
          aura_duration = ?,
          nausea = ?,
          vomiting = ?,
          photophobia = ?,
          phonophobia = ?,
          other_symptoms = ?,
          prodrome_symptoms = ?,
          postdrome_symptoms = ?,
          triggers = ?,
          food_triggers = ?,
          menstrual_related = ?,
          weather_related = ?,
          took_medication = ?,
          medications = ?,
          relief_at_30min = ?,
          relief_at_1hr = ?,
          relief_at_2hr = ?,
          relief_at_4hr = ?,
          functional_impact = ?,
          could_work = ?,
          bed_bound_hours = ?,
          midas_data = ?,
          midas_score = ?,
          midas_grade = ?,
          migraine_classification = ?,
          migraine_type = ?,
          meets_ichd3_criteria = ?,
          ichd3_criteria_count = ?,
          headache_days_30 = ?,
          migraine_days_30 = ?,
          note = ?,
          pain_location = ?,
          medication_details = ?,
          medication_timing = ?,
          relief_achieved = ?,
          disability_level = ?
        WHERE id = ?`,
        [
          updates.started_at,
          updates.ended_at || null,
          updates.is_ongoing ? 1 : 0,
          updates.is_completed ? 1 : 0,
          updates.time_to_peak || null,
          
          // Sleep data
          updates.sleep_hours || null,
          updates.sleep_quality || null,
          updates.had_nap ? 1 : 0,
          updates.nap_duration || null,
          
          // Hydration
          updates.fluid_intake_oz || null,
          updates.was_dehydrated ? 1 : 0,
          
          // Pain characteristics
          updates.severity,
          updates.pain_locations || null,
          updates.pain_laterality || null,
          updates.pain_quality || null,
          updates.worsened_by_movement !== null && updates.worsened_by_movement !== undefined 
            ? (updates.worsened_by_movement ? 1 : 0) : null,
          
          // Aura
          updates.aura_present !== null && updates.aura_present !== undefined 
            ? (updates.aura_present ? 1 : 0) : null,
          updates.aura_types || null,
          updates.aura_duration || null,
          
          // Associated symptoms
          updates.nausea ? 1 : 0,
          updates.vomiting ? 1 : 0,
          updates.photophobia ? 1 : 0,
          updates.phonophobia ? 1 : 0,
          updates.other_symptoms || null,
          
          // Phases
          updates.prodrome_symptoms || null,
          updates.postdrome_symptoms || null,
          
          // Triggers
          updates.triggers || null,
          updates.food_triggers || null,
          updates.menstrual_related !== null && updates.menstrual_related !== undefined 
            ? (updates.menstrual_related ? 1 : 0) : null,
          updates.weather_related !== null && updates.weather_related !== undefined 
            ? (updates.weather_related ? 1 : 0) : null,
          
          // Medication
          updates.took_medication !== null && updates.took_medication !== undefined 
            ? (updates.took_medication ? 1 : 0) : null,
          updates.medications || null,
          updates.relief_at_30min || null,
          updates.relief_at_1hr || null,
          updates.relief_at_2hr || null,
          updates.relief_at_4hr || null,
          
          // Disability & Function
          updates.functional_impact || null,
          updates.could_work !== null && updates.could_work !== undefined 
            ? (updates.could_work ? 1 : 0) : null,
          updates.bed_bound_hours || null,
          
          // MIDAS
          updates.midas_data || null,
          updates.midas_score || null,
          updates.midas_grade || null,
          
          // Classification
          updates.migraine_classification || null,
          updates.migraine_type || null,
          updates.meets_ichd3_criteria !== null && updates.meets_ichd3_criteria !== undefined 
            ? (updates.meets_ichd3_criteria ? 1 : 0) : null,
          updates.ichd3_criteria_count || null,
          updates.headache_days_30 || null,
          updates.migraine_days_30 || null,
          
          // Notes
          updates.note || null,
          
          // Legacy fields
          updates.pain_location || null,
          updates.medication_details || null,
          updates.medication_timing || null,
          updates.relief_achieved || null,
          updates.disability_level || null,
          
          id,
        ]
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function getMigraineReadings(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM migraine_readings ORDER BY started_at DESC`
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getMigraineReadingById(id: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getFirstSync(
        `SELECT * FROM migraine_readings WHERE id = ?`,
        [id]
      );
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function deleteMigraineReading(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      db.runSync(`DELETE FROM migraine_readings WHERE id = ?`, [id]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function getBPReadings(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM bp_readings ORDER BY measured_at DESC`
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getMigraineEntriesInRange(startMs: number, endMs: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM migraine_readings WHERE started_at >= ? AND started_at <= ? ORDER BY started_at DESC`,
        [startMs, endMs]
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getBpReadingsInRange(startMs: number, endMs: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM bp_readings WHERE measured_at >= ? AND measured_at <= ? ORDER BY measured_at DESC`,
        [startMs, endMs]
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getMeditationLogsInRange(startMs: number, endMs: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM meditation_sessions WHERE session_date >= ? AND session_date <= ? ORDER BY session_date DESC`,
        [startMs, endMs]
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getMedicationsAndSchedules(): Promise<{ medications: any[]; schedules: any[] }> {
  return new Promise((resolve, reject) => {
    try {
      const medications = db.getAllSync(
        `SELECT * FROM medications ORDER BY COALESCE(start_date, created_at) DESC`
      );
      const schedules = db.getAllSync(
        `SELECT * FROM dose_schedules WHERE parent_type = 'medication' ORDER BY time_of_day ASC`
      );
      resolve({ medications: medications || [], schedules: schedules || [] });
    } catch (error) {
      reject(error);
    }
  });
}

export function saveJournalEntry(entry: {
  mood?: string;
  mood_intensity?: number | null;
  energy_level?: number | null;
  stress_level?: number | null;
  sleep_quality?: number | null;
  sleep_hours?: number | null;
  physical_symptoms?: string;
  social_activity?: string;
  exercise_duration?: number | null;
  exercise_type?: string;
  nutrition_quality?: number | null;
  hydration_glasses?: number | null;
  weather?: string;
  location?: string;
  gratitude?: string;
  goals_achieved?: string;
  challenges?: string;
  note?: string;
  photo_uri?: string;
  photo_asset_id?: string | null;
  tags?: string[];
  entry_date?: number;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const id = generateId();
      const userId = 'local-user';
      const entryDate = entry.entry_date || Date.now();

      db.runSync(
        `INSERT INTO journals (
          id, user_id, entry_date, mood, mood_intensity, energy_level, stress_level,
          sleep_quality, sleep_hours, physical_symptoms, social_activity,
          exercise_duration, exercise_type, nutrition_quality, hydration_glasses,
          weather, location, gratitude, goals_achieved, challenges, note,
          photo_uri, photo_asset_id, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          entryDate,
          entry.mood || null,
          typeof entry.mood_intensity === 'number' ? entry.mood_intensity : null,
          typeof entry.energy_level === 'number' ? entry.energy_level : null,
          typeof entry.stress_level === 'number' ? entry.stress_level : null,
          typeof entry.sleep_quality === 'number' ? entry.sleep_quality : null,
          typeof entry.sleep_hours === 'number' ? entry.sleep_hours : null,
          entry.physical_symptoms || null,
          entry.social_activity || null,
          typeof entry.exercise_duration === 'number' ? entry.exercise_duration : null,
          entry.exercise_type || null,
          typeof entry.nutrition_quality === 'number' ? entry.nutrition_quality : null,
          typeof entry.hydration_glasses === 'number' ? entry.hydration_glasses : null,
          entry.weather || null,
          entry.location || null,
          entry.gratitude || null,
          entry.goals_achieved || null,
          entry.challenges || null,
          entry.note || '',
          entry.photo_uri || null,
          entry.photo_asset_id || null,
          entry.tags ? JSON.stringify(entry.tags) : '[]',
        ],
      );

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function getJournalEntries(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM journals ORDER BY entry_date DESC`,
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getTodaySummary(): Promise<{ steps: number; bp?: { s: number; d: number } }> {
  return new Promise(async (resolve) => {
    try {
      const [latest, steps] = await Promise.all([
        getLatestBP(),
        getTodayStepCount(),
      ]);

      resolve({
        steps,
        bp: latest ? { s: latest.systolic, d: latest.diastolic } : undefined,
      });
    } catch (error) {
      resolve({ steps: 0 });
    }
  });
}

// ========== Medication Functions ==========
export function createMedication(med: {
  name: string;
  dosage: string;
  notes?: string;
  start_date?: number;
  prescribing_doctor?: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = generateId();
      db.runSync(
        `INSERT INTO medications (id, name, dosage, notes, start_date, prescribing_doctor, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          id,
          med.name,
          med.dosage,
          med.notes || '',
          med.start_date || Date.now(),
          med.prescribing_doctor || null,
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getMedications(activeOnly: boolean = false): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      // Use COALESCE to handle missing start_date column
      const query = activeOnly
        ? `SELECT * FROM medications WHERE is_active = 1 ORDER BY COALESCE(start_date, created_at) DESC`
        : `SELECT * FROM medications ORDER BY COALESCE(start_date, created_at) DESC`;
      const result = db.getAllSync(query);
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getMedicationById(id: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getFirstSync(`SELECT * FROM medications WHERE id = ?`, [id]);
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function updateMedication(id: string, updates: Partial<{
  name: string;
  dosage: string;
  notes: string;
  is_active: number;
  end_date: number | null;
  prescribing_doctor: string;
}>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (fields.length === 0) {
        resolve();
        return;
      }
      
      values.push(id);
      db.runSync(`UPDATE medications SET ${fields.join(', ')} WHERE id = ?`, values);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// ========== Supplement Functions ==========
export function createSupplement(supp: {
  name: string;
  dosage: string;
  notes?: string;
  start_date?: number;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = generateId();
      db.runSync(
        `INSERT INTO supplements (id, name, dosage, notes, start_date, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [
          id,
          supp.name,
          supp.dosage,
          supp.notes || '',
          supp.start_date || Date.now(),
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getSupplements(activeOnly: boolean = false): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      // Use COALESCE to handle missing start_date column
      const query = activeOnly
        ? `SELECT * FROM supplements WHERE is_active = 1 ORDER BY COALESCE(start_date, created_at) DESC`
        : `SELECT * FROM supplements ORDER BY COALESCE(start_date, created_at) DESC`;
      const result = db.getAllSync(query);
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getSupplementById(id: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getFirstSync(`SELECT * FROM supplements WHERE id = ?`, [id]);
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function updateSupplement(id: string, updates: Partial<{
  name: string;
  dosage: string;
  notes: string;
  is_active: number;
  end_date: number | null;
}>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (fields.length === 0) {
        resolve();
        return;
      }
      
      values.push(id);
      db.runSync(`UPDATE supplements SET ${fields.join(', ')} WHERE id = ?`, values);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// ========== Meditation Routine Functions ==========
export function createMeditationRoutine(routine: {
  name: string;
  target_minutes?: number;
  notes?: string;
  start_date?: number;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = generateId();
      db.runSync(
        `INSERT INTO meditation_routines (id, name, target_minutes, notes, start_date, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [
          id,
          routine.name,
          routine.target_minutes || 10,
          routine.notes || '',
          routine.start_date || Date.now(),
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getMeditationRoutines(activeOnly: boolean = false): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      // Use COALESCE to handle missing start_date column
      const query = activeOnly
        ? `SELECT * FROM meditation_routines WHERE is_active = 1 ORDER BY COALESCE(start_date, created_at) DESC`
        : `SELECT * FROM meditation_routines ORDER BY COALESCE(start_date, created_at) DESC`;
      const result = db.getAllSync(query);
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getMeditationRoutineById(id: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getFirstSync(`SELECT * FROM meditation_routines WHERE id = ?`, [id]);
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function updateMeditationRoutine(id: string, updates: Partial<{
  name: string;
  target_minutes: number;
  notes: string;
  is_active: number;
}>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (fields.length === 0) {
        resolve();
        return;
      }
      
      values.push(id);
      db.runSync(`UPDATE meditation_routines SET ${fields.join(', ')} WHERE id = ?`, values);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// ========== Appointment Functions ==========
export function createAppointment(apt: {
  doctor_name: string;
  specialty?: string;
  location?: string;
  appointment_date: number;
  appointment_type?: 'visit' | 'followup';
  notes?: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = generateId();
      db.runSync(
        `INSERT INTO appointments (id, doctor_name, specialty, location, appointment_date, appointment_type, notes, is_completed)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          id,
          apt.doctor_name,
          apt.specialty || null,
          apt.location || null,
          apt.appointment_date,
          apt.appointment_type || 'visit',
          apt.notes || '',
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getAppointments(upcomingOnly: boolean = false): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const query = upcomingOnly
        ? `SELECT * FROM appointments WHERE appointment_date >= ? AND is_completed = 0 ORDER BY appointment_date ASC`
        : `SELECT * FROM appointments ORDER BY appointment_date DESC`;
      const result = db.getAllSync(query, upcomingOnly ? [Date.now()] : []);
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getAppointmentById(id: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getFirstSync(`SELECT * FROM appointments WHERE id = ?`, [id]);
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function updateAppointment(id: string, updates: Partial<{
  doctor_name: string;
  specialty: string;
  location: string;
  appointment_date: number;
  appointment_type: 'visit' | 'followup';
  notes: string;
  is_completed: number;
}>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (fields.length === 0) {
        resolve();
        return;
      }
      
      values.push(id);
      db.runSync(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`, values);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// ========== Dose Schedule Functions ==========
export function createDoseSchedule(schedule: {
  parent_type: 'medication' | 'supplement';
  parent_id: string;
  time_of_day: string; // e.g., "08:00", "20:00"
  days_of_week: string; // JSON array: [0,1,2,3,4,5,6] for Sun-Sat
  dosage?: string;
  instructions?: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = generateId();
      db.runSync(
        `INSERT INTO dose_schedules (id, parent_type, parent_id, time_of_day, days_of_week, dosage, instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          schedule.parent_type,
          schedule.parent_id,
          schedule.time_of_day,
          schedule.days_of_week,
          schedule.dosage || null,
          schedule.instructions || null,
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getDoseSchedulesByParent(parentType: 'medication' | 'supplement', parentId: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM dose_schedules WHERE parent_type = ? AND parent_id = ? ORDER BY time_of_day ASC`,
        [parentType, parentId]
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function deleteDoseSchedule(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      db.runSync(`DELETE FROM dose_schedules WHERE id = ?`, [id]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// ========== Tracking Event Functions ==========
export async function createTrackingEvent(event: {
  parent_type: 'medication' | 'supplement' | 'meditation' | 'appointment';
  parent_id: string;
  schedule_id?: string;
  event_type: 'taken' | 'done' | 'skipped' | 'missed';
  event_date: number;
  event_time?: number;
  metadata?: string;
}): Promise<string> {
  try {
    const id = generateId();
    
    db.runSync(
      `INSERT INTO tracking_events (id, parent_type, parent_id, schedule_id, event_type, event_date, event_time, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        event.parent_type,
        event.parent_id,
        event.schedule_id || null,
        event.event_type,
        event.event_date,
        event.event_time || null,
        event.metadata ? JSON.stringify(event.metadata) : null,
      ]
    );
    
    return id;
  } catch (error) {
    throw error;
  }
}

export async function deleteTrackingEvent(params: {
  parent_id: string;
  schedule_id?: string;
  event_date: number;
  event_type?: 'taken' | 'done' | 'skipped' | 'missed';
}): Promise<void> {
  try {
    const startOfDay = new Date(params.event_date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(params.event_date);
    endOfDay.setHours(23, 59, 59, 999);
    
    let query = `DELETE FROM tracking_events 
                 WHERE parent_id = ? 
                 AND event_date >= ? 
                 AND event_date <= ?`;
    const queryParams: any[] = [params.parent_id, startOfDay.getTime(), endOfDay.getTime()];
    
    if (params.schedule_id) {
      query += ` AND schedule_id = ?`;
      queryParams.push(params.schedule_id);
    }
    
    if (params.event_type) {
      query += ` AND event_type = ?`;
      queryParams.push(params.event_type);
    }
    
    db.runSync(query, queryParams);
  } catch (error) {
    throw error;
  }
}

export function getTrackingEventsByParent(
  parentType: 'medication' | 'supplement' | 'meditation' | 'appointment',
  parentId: string,
  startDate?: number,
  endDate?: number
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      let query = `SELECT * FROM tracking_events WHERE parent_type = ? AND parent_id = ?`;
      const params: any[] = [parentType, parentId];
      
      if (startDate) {
        query += ` AND event_date >= ?`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND event_date <= ?`;
        params.push(endDate);
      }
      
      query += ` ORDER BY event_date DESC, event_time DESC`;
      
      const result = db.getAllSync(query, params);
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getTrackingEventsByDate(date: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const result = db.getAllSync(
        `SELECT * FROM tracking_events WHERE event_date >= ? AND event_date <= ? ORDER BY event_time ASC`,
        [startOfDay.getTime(), endOfDay.getTime()]
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

// ========== Workout Functions ==========
export function getWorkouts(startDate?: number, endDate?: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      let query = `SELECT * FROM workouts ORDER BY started_at DESC`;
      const params: any[] = [];
      
      if (startDate && endDate) {
        query = `SELECT * FROM workouts WHERE started_at >= ? AND started_at <= ? ORDER BY started_at DESC`;
        params.push(startDate, endDate);
      } else if (startDate) {
        query = `SELECT * FROM workouts WHERE started_at >= ? ORDER BY started_at DESC`;
        params.push(startDate);
      }
      
      const result = db.getAllSync(query, params);
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function saveWorkout(workout: {
  workout_type: string;
  duration: number;
  intensity?: string;
  calories_burned?: number;
  note?: string;
  started_at?: number;
  ended_at?: number;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = generateId();
      const startedAt = workout.started_at || Date.now();
      const endedAt = workout.ended_at || startedAt + (workout.duration * 60 * 1000);
      
      db.runSync(
        `INSERT INTO workouts (id, workout_type, duration, intensity, calories_burned, note, started_at, ended_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          workout.workout_type,
          workout.duration,
          workout.intensity || null,
          workout.calories_burned || null,
          workout.note || '',
          startedAt,
          endedAt,
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

// ========== Steps Functions ==========
export function getSteps(startDate?: number, endDate?: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      let query = `SELECT * FROM steps ORDER BY date DESC`;
      const params: any[] = [];
      
      if (startDate && endDate) {
        query = `SELECT * FROM steps WHERE date >= ? AND date <= ? ORDER BY date DESC`;
        params.push(startDate, endDate);
      } else if (startDate) {
        query = `SELECT * FROM steps WHERE date >= ? ORDER BY date DESC`;
        params.push(startDate);
      }
      
      const result = db.getAllSync(query, params);
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function saveSteps(steps: { steps: number; date?: number; source?: string }): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = generateId();
      const date = steps.date || Date.now();
      
      db.runSync(
        `INSERT INTO steps (id, steps, date, source)
         VALUES (?, ?, ?, ?)`,
        [id, steps.steps, date, steps.source || 'manual']
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

// ========== Activity Aggregates ==========
export function getActivityAggregates(
  period: 'week' | 'month' | 'year' | 'all'
): Promise<Array<{ day: string; value: number; date: number }>> {
  return new Promise((resolve, reject) => {
    try {
      const now = Date.now();
      let startDate: number;
      let days: number;
      
      switch (period) {
        case 'week':
          days = 7;
          startDate = now - (7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          days = 30;
          startDate = now - (30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          days = 365;
          startDate = now - (365 * 24 * 60 * 60 * 1000);
          break;
        default:
          days = 7;
          startDate = 0;
      }
      
      // Get workouts in the period
      const workouts = db.getAllSync(
        `SELECT * FROM workouts WHERE started_at >= ? ORDER BY started_at ASC`,
        [startDate]
      ) || [];
      
      // Group by day
      const dayMap = new Map<number, number>();
      const dayLabels = new Map<number, string>();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(now - (i * 24 * 60 * 60 * 1000));
        date.setHours(0, 0, 0, 0);
        const timestamp = date.getTime();
        dayMap.set(timestamp, 0);
        
        if (period === 'week') {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          dayLabels.set(timestamp, dayNames[date.getDay()]);
        } else {
          dayLabels.set(timestamp, date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
      }
      
      // Aggregate workout durations by day
      workouts.forEach((workout: any) => {
        const date = new Date(workout.started_at);
        date.setHours(0, 0, 0, 0);
        const timestamp = date.getTime();
        const current = dayMap.get(timestamp) || 0;
        dayMap.set(timestamp, current + (workout.duration || 0));
      });
      
      // Convert to array
      const aggregates: Array<{ day: string; value: number; date: number }> = [];
      const sortedDates = Array.from(dayMap.keys()).sort();
      
      sortedDates.forEach((timestamp) => {
        aggregates.push({
          day: dayLabels.get(timestamp) || '',
          value: dayMap.get(timestamp) || 0,
          date: timestamp,
        });
      });
      
      resolve(aggregates);
    } catch (error) {
      reject(error);
    }
  });
}

// ========== AILY Blog Functions ==========
export function saveAilyBlog(entry: {
  entry_date: number;
  photo_uri?: string | null;
  photo_asset_id?: string | null;
  letter?: string | null;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = generateId();
      db.runSync(
        `INSERT INTO aily_blogs (id, entry_date, photo_uri, photo_asset_id, letter)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          entry.entry_date,
          entry.photo_uri || null,
          entry.photo_asset_id || null,
          entry.letter || null,
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getAilyBlogs(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM aily_blogs ORDER BY entry_date DESC`
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getAilyBlogById(id: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM aily_blogs WHERE id = ?`,
        [id]
      );
      resolve(result && result.length > 0 ? result[0] : null);
    } catch (error) {
      reject(error);
    }
  });
}

export function deleteAilyBlog(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      db.runSync(`DELETE FROM aily_blogs WHERE id = ?`, [id]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// ========== Transformation Tracker Functions ==========

export function createTransformationProfile(profile: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = profile.id || generateId();
      const now = Date.now();
      db.runSync(
        `INSERT INTO transformation_profiles (
          id, user_id, age, sex, height_cm, weight_kg, body_fat_pct, diet, training_frequency,
          sleep_hours, smoking, alcohol, medical_issues, hairfall_years, hair_thinning_location,
          family_history_father, family_history_maternal_grandfather, skin_type, skin_concerns,
          goal_seriousness, emotional_context, onboarding_complete, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          profile.user_id || 'local-user',
          profile.age ?? null,
          profile.sex ?? null,
          profile.height_cm ?? null,
          profile.weight_kg ?? null,
          profile.body_fat_pct ?? null,
          profile.diet ?? null,
          profile.training_frequency ?? null,
          profile.sleep_hours ?? null,
          profile.smoking ? 1 : 0,
          profile.alcohol ? 1 : 0,
          profile.medical_issues ?? null,
          profile.hairfall_years ?? null,
          profile.hair_thinning_location ?? null,
          profile.family_history_father ? 1 : 0,
          profile.family_history_maternal_grandfather ? 1 : 0,
          profile.skin_type ?? null,
          profile.skin_concerns ?? null,
          profile.goal_seriousness ?? null,
          profile.emotional_context ?? null,
          profile.onboarding_complete ? 1 : 0,
          now,
          now,
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getTransformationProfile(): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getFirstSync(
        `SELECT * FROM transformation_profiles WHERE user_id = 'local-user' ORDER BY created_at DESC LIMIT 1`
      );
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function updateTransformationProfile(id: string, updates: Record<string, any>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const allowed = [
        'age', 'sex', 'height_cm', 'weight_kg', 'body_fat_pct', 'diet', 'training_frequency',
        'sleep_hours', 'smoking', 'alcohol', 'medical_issues', 'hairfall_years', 'hair_thinning_location',
        'family_history_father', 'family_history_maternal_grandfather', 'skin_type', 'skin_concerns',
        'goal_seriousness', 'emotional_context', 'onboarding_complete'
      ];
      const fields: string[] = ['updated_at = ?'];
      const values: any[] = [Date.now()];
      Object.entries(updates).forEach(([key, value]) => {
        if (allowed.includes(key) && value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
        }
      });
      if (fields.length <= 1) {
        resolve();
        return;
      }
      values.push(id);
      db.runSync(`UPDATE transformation_profiles SET ${fields.join(', ')} WHERE id = ?`, values);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function createTransformationGoals(goals: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = goals.id || generateId();
      db.runSync(
        `INSERT INTO transformation_goals (
          id, user_id, profile_id, target_weight_min, target_weight_max, target_body_fat_min, target_body_fat_max,
          timeline_months, calories_min, calories_max, protein_min, protein_max, fat_min, fat_max,
          carbs_min, carbs_max, steps_goal, incline_walk_min, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          goals.user_id || 'local-user',
          goals.profile_id ?? null,
          goals.target_weight_min ?? null,
          goals.target_weight_max ?? null,
          goals.target_body_fat_min ?? null,
          goals.target_body_fat_max ?? null,
          goals.timeline_months ?? null,
          goals.calories_min ?? null,
          goals.calories_max ?? null,
          goals.protein_min ?? null,
          goals.protein_max ?? null,
          goals.fat_min ?? null,
          goals.fat_max ?? null,
          goals.carbs_min ?? null,
          goals.carbs_max ?? null,
          goals.steps_goal ?? null,
          goals.incline_walk_min ?? null,
          Date.now(),
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getTransformationGoals(profileId?: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      let result;
      if (profileId) {
        result = db.getFirstSync(`SELECT * FROM transformation_goals WHERE profile_id = ?`, [profileId]);
      } else {
        result = db.getFirstSync(`SELECT * FROM transformation_goals WHERE user_id = 'local-user' ORDER BY created_at DESC LIMIT 1`);
      }
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function createTransformationRoutines(routines: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = routines.id || generateId();
      const now = Date.now();
      db.runSync(
        `INSERT INTO transformation_routines (
          id, user_id, profile_id, skin_am_items, skin_pm_items, hair_items, beard_items,
          supplement_schedule, retinol_schedule, ketoconazole_schedule, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          routines.user_id || 'local-user',
          routines.profile_id ?? null,
          typeof routines.skin_am_items === 'string' ? routines.skin_am_items : JSON.stringify(routines.skin_am_items || []),
          typeof routines.skin_pm_items === 'string' ? routines.skin_pm_items : JSON.stringify(routines.skin_pm_items || []),
          typeof routines.hair_items === 'string' ? routines.hair_items : JSON.stringify(routines.hair_items || []),
          typeof routines.beard_items === 'string' ? routines.beard_items : JSON.stringify(routines.beard_items || []),
          typeof routines.supplement_schedule === 'string' ? routines.supplement_schedule : JSON.stringify(routines.supplement_schedule || []),
          typeof routines.retinol_schedule === 'string' ? routines.retinol_schedule : JSON.stringify(routines.retinol_schedule || {}),
          typeof routines.ketoconazole_schedule === 'string' ? routines.ketoconazole_schedule : JSON.stringify(routines.ketoconazole_schedule || {}),
          now,
          now,
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getTransformationRoutines(profileId?: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      let result;
      if (profileId) {
        result = db.getFirstSync(`SELECT * FROM transformation_routines WHERE profile_id = ?`, [profileId]);
      } else {
        result = db.getFirstSync(`SELECT * FROM transformation_routines WHERE user_id = 'local-user' ORDER BY created_at DESC LIMIT 1`);
      }
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function createMealPlan(plan: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = plan.id || generateId();
      const now = Date.now();
      const toJson = (v: any) => typeof v === 'string' ? v : JSON.stringify(v || []);
      db.runSync(
        `INSERT INTO meal_plans (
          id, user_id, profile_id, plan_name, day_1_meals, day_2_meals, day_3_meals, day_4_meals,
          day_5_meals, day_6_meals, day_7_meals, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          plan.user_id || 'local-user',
          plan.profile_id ?? null,
          plan.plan_name ?? '7-Day Plan',
          toJson(plan.day_1_meals),
          toJson(plan.day_2_meals),
          toJson(plan.day_3_meals),
          toJson(plan.day_4_meals),
          toJson(plan.day_5_meals),
          toJson(plan.day_6_meals),
          toJson(plan.day_7_meals),
          plan.is_active !== 0 ? 1 : 0,
          now,
          now,
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getMealPlan(profileId?: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      let result;
      if (profileId) {
        result = db.getFirstSync(`SELECT * FROM meal_plans WHERE profile_id = ? AND is_active = 1`, [profileId]);
      } else {
        result = db.getFirstSync(`SELECT * FROM meal_plans WHERE user_id = 'local-user' AND is_active = 1 ORDER BY created_at DESC LIMIT 1`);
      }
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function createMealPlanAdherence(adherence: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = adherence.id || generateId();
      db.runSync(
        `INSERT INTO meal_plan_adherence (
          id, user_id, meal_plan_id, adherence_date, day_of_week, breakfast_completed, lunch_completed,
          post_workout_completed, dinner_completed, swaps, notes, created_at, protein_grams
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          adherence.user_id || 'local-user',
          adherence.meal_plan_id ?? null,
          adherence.adherence_date,
          adherence.day_of_week ?? new Date(adherence.adherence_date).getDay(),
          adherence.breakfast_completed ? 1 : 0,
          adherence.lunch_completed ? 1 : 0,
          adherence.post_workout_completed ? 1 : 0,
          adherence.dinner_completed ? 1 : 0,
          typeof adherence.swaps === 'string' ? adherence.swaps : JSON.stringify(adherence.swaps || []),
          adherence.notes ?? null,
          Date.now(),
          adherence.protein_grams ?? null,
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getMealPlanAdherenceByDate(date: number): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const result = db.getFirstSync(
        `SELECT * FROM meal_plan_adherence WHERE adherence_date >= ? AND adherence_date <= ?`,
        [startOfDay.getTime(), endOfDay.getTime()]
      );
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function getMealPlanAdherenceInRange(startDate: number, endDate: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const rows = db.getAllSync(
        `SELECT * FROM meal_plan_adherence WHERE adherence_date >= ? AND adherence_date <= ? ORDER BY adherence_date ASC`,
        [startDate, endDate]
      );
      resolve(rows || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function updateMealPlanAdherence(id: string, updates: Record<string, any>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      const map: Record<string, string> = {
        breakfast_completed: 'breakfast_completed',
        lunch_completed: 'lunch_completed',
        post_workout_completed: 'post_workout_completed',
        dinner_completed: 'dinner_completed',
        swaps: 'swaps',
        notes: 'notes',
        protein_grams: 'protein_grams',
      };
      Object.entries(updates).forEach(([key, value]) => {
        if (map[key] && value !== undefined) {
          fields.push(`${map[key]} = ?`);
          values.push(key === 'swaps' && typeof value !== 'string' ? JSON.stringify(value) : value);
        }
      });
      if (fields.length === 0) {
        resolve();
        return;
      }
      values.push(id);
      db.runSync(`UPDATE meal_plan_adherence SET ${fields.join(', ')} WHERE id = ?`, values);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function createWorkoutPlan(plan: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = plan.id || generateId();
      const now = Date.now();
      const toJson = (v: any) => typeof v === 'string' ? v : JSON.stringify(v || []);
      db.runSync(
        `INSERT INTO workout_plans (
          id, user_id, profile_id, plan_name, day_1_exercises, day_2_exercises, day_3_exercises,
          day_4_exercises, day_5_exercises, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          plan.user_id || 'local-user',
          plan.profile_id ?? null,
          plan.plan_name ?? '5-Day Split',
          toJson(plan.day_1_exercises),
          toJson(plan.day_2_exercises),
          toJson(plan.day_3_exercises),
          toJson(plan.day_4_exercises),
          toJson(plan.day_5_exercises),
          plan.is_active !== 0 ? 1 : 0,
          now,
          now,
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getWorkoutPlan(profileId?: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      let result;
      if (profileId) {
        result = db.getFirstSync(`SELECT * FROM workout_plans WHERE profile_id = ? AND is_active = 1`, [profileId]);
      } else {
        result = db.getFirstSync(`SELECT * FROM workout_plans WHERE user_id = 'local-user' AND is_active = 1 ORDER BY created_at DESC LIMIT 1`);
      }
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

/** 5-day split tags for transformation tracking */
export const WORKOUT_SPLIT_TAGS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower'] as const;

export function createWorkoutLog(log: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = log.id || generateId();
      const startedAt = log.started_at || Date.now();
      const endedAt = log.ended_at || startedAt + (log.duration || 60) * 60 * 1000;
      const splitTag = log.split_tag ?? (WORKOUT_SPLIT_TAGS.includes(log.workout_type) ? log.workout_type : null);
      const isLegDay = log.is_leg_day != null ? (log.is_leg_day ? 1 : 0) : (splitTag === 'Legs' || splitTag === 'Lower' ? 1 : 0);
      db.runSync(
        `INSERT INTO workout_logs (
          id, user_id, workout_plan_id, workout_type, day_number, exercises_data, duration,
          incline_walk_minutes, intensity, calories_burned, note, started_at, ended_at, created_at,
          split_tag, progressive_overload, is_leg_day
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          log.user_id || 'local-user',
          log.workout_plan_id ?? null,
          log.workout_type,
          log.day_number ?? null,
          typeof log.exercises_data === 'string' ? log.exercises_data : JSON.stringify(log.exercises_data || []),
          log.duration || 60,
          log.incline_walk_minutes ?? null,
          log.intensity ?? null,
          log.calories_burned ?? null,
          log.note ?? null,
          startedAt,
          endedAt,
          Date.now(),
          splitTag ?? null,
          log.progressive_overload ? 1 : 0,
          isLegDay,
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getWorkoutLogs(startDate?: number, endDate?: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      let query = `SELECT * FROM workout_logs ORDER BY started_at DESC`;
      const params: any[] = [];
      if (startDate && endDate) {
        query = `SELECT * FROM workout_logs WHERE started_at >= ? AND started_at <= ? ORDER BY started_at DESC`;
        params.push(startDate, endDate);
      } else if (startDate) {
        query = `SELECT * FROM workout_logs WHERE started_at >= ? ORDER BY started_at DESC`;
        params.push(startDate);
      }
      const result = db.getAllSync(query, params);
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function createWeeklyCheckin(checkin: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = checkin.id || generateId();
      db.runSync(
        `INSERT INTO weekly_checkins (
          id, user_id, checkin_date, weight_kg, waist_cm, body_fat_pct, strength_prs, adherence_pct, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          checkin.user_id || 'local-user',
          checkin.checkin_date || Date.now(),
          checkin.weight_kg ?? null,
          checkin.waist_cm ?? null,
          checkin.body_fat_pct ?? null,
          checkin.strength_prs ?? null,
          checkin.adherence_pct ?? null,
          checkin.notes ?? null,
          Date.now(),
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getWeeklyCheckins(limit?: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const query = limit
        ? `SELECT * FROM weekly_checkins ORDER BY checkin_date DESC LIMIT ?`
        : `SELECT * FROM weekly_checkins ORDER BY checkin_date DESC`;
      const result = db.getAllSync(query, limit ? [limit] : []);
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function createProgressPhotoMeta(meta: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = meta.id || generateId();
      db.runSync(
        `INSERT INTO progress_photos_meta (id, user_id, photo_date, lighting_notes, angles, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          meta.user_id || 'local-user',
          meta.photo_date || Date.now(),
          meta.lighting_notes ?? null,
          meta.angles ?? null,
          meta.notes ?? null,
          Date.now(),
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getProgressPhotosMeta(limit?: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const query = limit
        ? `SELECT * FROM progress_photos_meta ORDER BY photo_date DESC LIMIT ?`
        : `SELECT * FROM progress_photos_meta ORDER BY photo_date DESC`;
      const result = db.getAllSync(query, limit ? [limit] : []);
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function createHairlineCheck(check: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = check.id || generateId();
      db.runSync(
        `INSERT INTO hairline_checks (id, user_id, check_date, notes, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          check.user_id || 'local-user',
          check.check_date || Date.now(),
          check.notes ?? null,
          Date.now(),
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getLastHairlineCheck(): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getFirstSync(
        `SELECT * FROM hairline_checks ORDER BY check_date DESC LIMIT 1`
      );
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function getHairlineChecks(limit?: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const query = limit
        ? `SELECT * FROM hairline_checks ORDER BY check_date DESC LIMIT ?`
        : `SELECT * FROM hairline_checks ORDER BY check_date DESC`;
      const result = db.getAllSync(query, limit ? [limit] : []);
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function createTransformationReminder(reminder: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const id = reminder.id || generateId();
      const now = Date.now();
      db.runSync(
        `INSERT INTO transformation_reminders (
          id, user_id, reminder_type, time_of_day, days_of_week, frequency, is_enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          reminder.user_id || 'local-user',
          reminder.reminder_type,
          reminder.time_of_day ?? null,
          typeof reminder.days_of_week === 'string' ? reminder.days_of_week : JSON.stringify(reminder.days_of_week || []),
          reminder.frequency ?? null,
          reminder.is_enabled !== 0 ? 1 : 0,
          now,
          now,
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getTransformationReminders(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM transformation_reminders WHERE is_enabled = 1 ORDER BY reminder_type ASC`
      );
      resolve(result || []);
    } catch (error) {
      reject(error);
    }
  });
}

export function getRoutineChecklistByDate(date: number): Promise<any | null> {
  return new Promise((resolve, reject) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const result = db.getFirstSync(
        `SELECT * FROM routine_checklists WHERE checklist_date >= ? AND checklist_date <= ?`,
        [startOfDay.getTime(), endOfDay.getTime()]
      );
      resolve(result || null);
    } catch (error) {
      reject(error);
    }
  });
}

export function createOrUpdateRoutineChecklist(checklist: Record<string, any>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const date = checklist.checklist_date || Date.now();
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const dateTs = startOfDay.getTime();

      const endOfDay = dateTs + 24 * 60 * 60 * 1000 - 1;
      const existing = db.getFirstSync(
        `SELECT * FROM routine_checklists WHERE checklist_date >= ? AND checklist_date <= ?`,
        [dateTs, endOfDay]
      );

      const toInt = (v: any) => (v ? 1 : 0);
      const fields = [
        'skin_am_done', 'skin_pm_done', 'sunscreen_done', 'retinol_done', 'hair_wash_done',
        'conditioner_done', 'beard_oil_done', 'supplements_morning_done', 'supplements_postworkout_done',
        'supplements_night_done', 'steps_done', 'steps_count', 'workout_done', 'ketoconazole_done', 'microneedling_done'
      ];
      const values: any[] = [];

      if (existing) {
        const updates: string[] = ['updated_at = ?'];
        values.push(Date.now());
        fields.forEach(f => {
          if (checklist[f] !== undefined) {
            updates.push(`${f} = ?`);
            values.push(f === 'steps_count' ? (checklist[f] ?? existing[f]) : toInt(checklist[f]));
          }
        });
        if (updates.length > 1) {
          values.push(existing.id);
          db.runSync(`UPDATE routine_checklists SET ${updates.join(', ')} WHERE id = ?`, values);
        }
        return Promise.resolve(existing.id);
      }

      const id = generateId();
      db.runSync(
        `INSERT INTO routine_checklists (
          id, user_id, checklist_date, skin_am_done, skin_pm_done, sunscreen_done, retinol_done,
          hair_wash_done, conditioner_done, beard_oil_done, supplements_morning_done, supplements_postworkout_done,
          supplements_night_done, steps_done, steps_count, workout_done, ketoconazole_done, microneedling_done,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          checklist.user_id || 'local-user',
          dateTs,
          toInt(checklist.skin_am_done),
          toInt(checklist.skin_pm_done),
          toInt(checklist.sunscreen_done),
          toInt(checklist.retinol_done),
          toInt(checklist.hair_wash_done),
          toInt(checklist.conditioner_done),
          toInt(checklist.beard_oil_done),
          toInt(checklist.supplements_morning_done),
          toInt(checklist.supplements_postworkout_done),
          toInt(checklist.supplements_night_done),
          toInt(checklist.steps_done),
          checklist.steps_count ?? null,
          toInt(checklist.workout_done),
          toInt(checklist.ketoconazole_done),
          toInt(checklist.microneedling_done),
          Date.now(),
          Date.now(),
        ]
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}

export function getRoutineChecklistsInRange(startDate: number, endDate: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const rows = db.getAllSync(
        `SELECT * FROM routine_checklists WHERE checklist_date >= ? AND checklist_date <= ? ORDER BY checklist_date ASC`,
        [startDate, endDate]
      );
      resolve(rows || []);
    } catch (error) {
      reject(error);
    }
  });
}

/** Count consecutive days (including today) with meaningful checklist completion (5+ items done). */
export async function getTransformationStreak(): Promise<number> {
  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let checkDate = today.getTime();
  let streak = 0;
  const doneFields = [
    'skin_am_done', 'skin_pm_done', 'sunscreen_done', 'hair_wash_done', 'conditioner_done',
    'beard_oil_done', 'supplements_morning_done', 'supplements_postworkout_done',
    'supplements_night_done', 'workout_done',
  ];
  while (true) {
    const cl = await getRoutineChecklistByDate(checkDate);
    const count = cl ? doneFields.filter((f) => cl[f]).length : 0;
    if (count < 5) break;
    streak++;
    checkDate -= dayMs;
  }
  return streak;
}