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
      console.log('Migration for medications table:', error);
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
      console.log('Migration for supplements table:', error);
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
      console.log('Migration for meditation_routines table:', error);
    }

    try {
      // Migrate meditation_sessions to add routine_id if it doesn't exist
      const sessionColumns = db.getAllSync(`PRAGMA table_info(meditation_sessions)`);
      const hasRoutineId = sessionColumns.some((col: any) => col.name === 'routine_id');
      if (!hasRoutineId) {
        db.execSync(`ALTER TABLE meditation_sessions ADD COLUMN routine_id TEXT;`);
      }
    } catch (error) {
      console.log('Migration for meditation_sessions table:', error);
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
              console.log(`Error adding column ${col.name}:`, err);
            }
          }
        }
      }
    } catch (error) {
      console.log('Migration for journals table:', error);
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
              console.log(`Error adding migraine column ${col.name}:`, err);
            }
          }
        }
      }
    } catch (error) {
      console.log('Migration for migraine_readings table:', error);
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
      console.log('Index creation:', error);
    }
    
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_dose_schedules_parent ON dose_schedules(parent_type, parent_id);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_tracking_events_parent ON tracking_events(parent_type, parent_id, event_date);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date, is_completed);`);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
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
      console.error('Error getting today summary:', error);
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
    console.log('Creating tracking event:', {
      id,
      parent_type: event.parent_type,
      parent_id: event.parent_id,
      schedule_id: event.schedule_id,
      event_type: event.event_type,
    });
    
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
    
    console.log('Tracking event created successfully:', id);
    return id;
  } catch (error) {
    console.error('Error creating tracking event:', error);
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
    
    console.log('Deleting tracking event:', {
      parent_id: params.parent_id,
      schedule_id: params.schedule_id,
      event_type: params.event_type,
    });
    
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
    console.log('Tracking event deleted successfully');
  } catch (error) {
    console.error('Error deleting tracking event:', error);
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