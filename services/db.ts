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

    // Migraine events
    db.execSync(`
      CREATE TABLE IF NOT EXISTS migraine_readings (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
        note TEXT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        triggers TEXT,
        symptoms TEXT,
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

    // Journal entries
    db.execSync(`
      CREATE TABLE IF NOT EXISTS journals (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'local-user',
        entry_date INTEGER NOT NULL,
        mood TEXT,
        energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
        note TEXT,
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

    // Create indexes for better performance
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_bp_readings_measured_at ON bp_readings(measured_at);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_migraine_started_at ON migraine_readings(started_at);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_steps_date ON steps(date);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_medication_logs_taken_at ON medication_logs(taken_at);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_supplement_logs_taken_at ON supplement_logs(taken_at);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_journals_entry_date ON journals(entry_date);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active, start_date);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_supplements_active ON supplements(is_active, start_date);`);
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
        `INSERT INTO migraine_readings (id, user_id, severity, note, started_at, ended_at, triggers, symptoms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          reading.severity,
          reading.note || '',
          reading.started_at || Date.now(),
          reading.ended_at,
          reading.triggers || '',
          reading.symptoms || '',
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

export function saveJournalEntry(entry: {
  mood?: string;
  energy_level?: number | null;
  note: string;
  tags?: string[];
  entry_date?: number;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const id = generateId();
      const userId = 'local-user';
      const entryDate = entry.entry_date || Date.now();

      db.runSync(
        `INSERT INTO journals (id, user_id, entry_date, mood, energy_level, note, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          entryDate,
          entry.mood || '',
          typeof entry.energy_level === 'number' ? entry.energy_level : null,
          entry.note,
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
      const query = activeOnly
        ? `SELECT * FROM medications WHERE is_active = 1 ORDER BY start_date DESC`
        : `SELECT * FROM medications ORDER BY start_date DESC`;
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
      const query = activeOnly
        ? `SELECT * FROM supplements WHERE is_active = 1 ORDER BY start_date DESC`
        : `SELECT * FROM supplements ORDER BY start_date DESC`;
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
      const query = activeOnly
        ? `SELECT * FROM meditation_routines WHERE is_active = 1 ORDER BY start_date DESC`
        : `SELECT * FROM meditation_routines ORDER BY start_date DESC`;
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
export function createTrackingEvent(event: {
  parent_type: 'medication' | 'supplement' | 'meditation' | 'appointment';
  parent_id: string;
  schedule_id?: string;
  event_type: 'taken' | 'done' | 'skipped' | 'missed';
  event_date: number;
  event_time?: number;
  metadata?: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
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
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
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