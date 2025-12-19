// services/tracking.ts
import {
  getMedications,
  getSupplements,
  getMeditationRoutines,
  getAppointments,
  getDoseSchedulesByParent,
  getTrackingEventsByParent,
  getTrackingEventsByDate,
} from './db';

export type DueItem = {
  id: string;
  type: 'medication' | 'supplement' | 'meditation' | 'appointment';
  name: string;
  scheduleId?: string;
  timeOfDay?: string;
  dosage?: string;
  status: 'pending' | 'done' | 'missed';
  streak?: number;
  adherence?: number;
};

export type TrackingStats = {
  streak: number;
  adherence: number;
  totalDays: number;
  daysSinceStarted: number;
  daysSinceLastDone: number | null;
};

// Get day of week (0 = Sunday, 6 = Saturday)
function getDayOfWeek(date: number): number {
  return new Date(date).getDay();
}

// Check if a day is in the schedule's days_of_week array
function isDayScheduled(daysOfWeek: string, date: number): boolean {
  try {
    const days = JSON.parse(daysOfWeek) as number[];
    const dayOfWeek = getDayOfWeek(date);
    return days.includes(dayOfWeek);
  } catch {
    return true; // If parsing fails, assume all days
  }
}

// Get start of day timestamp
function getStartOfDay(date: number = Date.now()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Get end of day timestamp
function getEndOfDay(date: number = Date.now()): number {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

// Parse time string (HH:mm) to minutes since midnight
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Get all due items for today
export async function getDueItemsToday(): Promise<DueItem[]> {
  const today = Date.now();
  const startOfDay = getStartOfDay(today);
  const endOfDay = getEndOfDay(today);
  const dayOfWeek = getDayOfWeek(today);
  
  const dueItems: DueItem[] = [];
  const todayEvents = await getTrackingEventsByDate(today);
  
  // Get medications with schedules
  const medications = await getMedications(true);
  for (const med of medications) {
    const schedules = await getDoseSchedulesByParent('medication', med.id);
    
    for (const schedule of schedules) {
      if (!isDayScheduled(schedule.days_of_week, today)) continue;
      
      const scheduleId = schedule.id;
      const timeOfDay = schedule.time_of_day;
      
      // Check if already tracked today for this schedule
      const eventToday = todayEvents.find(
        e => e.parent_id === med.id && 
             e.schedule_id === scheduleId &&
             e.event_type === 'taken'
      );
      
      const status = eventToday ? 'done' : 
                     (Date.now() > endOfDay) ? 'missed' : 'pending';
      
      const stats = await getTrackingStats('medication', med.id, scheduleId);
      
      dueItems.push({
        id: med.id,
        type: 'medication',
        name: med.name,
        scheduleId,
        timeOfDay,
        dosage: schedule.dosage || med.dosage,
        status,
        streak: stats.streak,
        adherence: stats.adherence,
      });
    }
  }
  
  // Get supplements with schedules
  const supplements = await getSupplements(true);
  for (const supp of supplements) {
    const schedules = await getDoseSchedulesByParent('supplement', supp.id);
    
    for (const schedule of schedules) {
      if (!isDayScheduled(schedule.days_of_week, today)) continue;
      
      const scheduleId = schedule.id;
      const timeOfDay = schedule.time_of_day;
      
      const eventToday = todayEvents.find(
        e => e.parent_id === supp.id && 
             e.schedule_id === scheduleId &&
             e.event_type === 'taken'
      );
      
      const status = eventToday ? 'done' : 
                     (Date.now() > endOfDay) ? 'missed' : 'pending';
      
      const stats = await getTrackingStats('supplement', supp.id, scheduleId);
      
      dueItems.push({
        id: supp.id,
        type: 'supplement',
        name: supp.name,
        scheduleId,
        timeOfDay,
        dosage: schedule.dosage || supp.dosage,
        status,
        streak: stats.streak,
        adherence: stats.adherence,
      });
    }
  }
  
  // Get meditation routines (daily goal)
  const routines = await getMeditationRoutines(true);
  for (const routine of routines) {
    const eventToday = todayEvents.find(
      e => e.parent_id === routine.id && 
           e.event_type === 'done'
    );
    
    const status = eventToday ? 'done' : 
                   (Date.now() > endOfDay) ? 'missed' : 'pending';
    
    const stats = await getTrackingStats('meditation', routine.id);
    
    dueItems.push({
      id: routine.id,
      type: 'meditation',
      name: routine.name,
      status,
      streak: stats.streak,
      adherence: stats.adherence,
    });
  }
  
  // Get appointments for today
  const appointments = await getAppointments();
  const todayAppointments = appointments.filter(apt => {
    const aptDate = getStartOfDay(apt.appointment_date);
    return aptDate >= startOfDay && aptDate <= endOfDay && !apt.is_completed;
  });
  
  for (const apt of todayAppointments) {
    const eventToday = todayEvents.find(
      e => e.parent_id === apt.id && 
           e.event_type === 'done'
    );
    
    const status = eventToday ? 'done' : 'pending';
    
    dueItems.push({
      id: apt.id,
      type: 'appointment',
      name: `${apt.doctor_name}${apt.specialty ? ` - ${apt.specialty}` : ''}`,
      status,
    });
  }
  
  // Sort by time of day (if available) or type
  return dueItems.sort((a, b) => {
    if (a.timeOfDay && b.timeOfDay) {
      return parseTime(a.timeOfDay) - parseTime(b.timeOfDay);
    }
    if (a.timeOfDay) return -1;
    if (b.timeOfDay) return 1;
    return 0;
  });
}

// Get tracking statistics for an item
export async function getTrackingStats(
  parentType: 'medication' | 'supplement' | 'meditation' | 'appointment',
  parentId: string,
  scheduleId?: string
): Promise<TrackingStats> {
  const parent = await (async () => {
    if (parentType === 'medication') {
      const { getMedicationById } = await import('./db');
      return await getMedicationById(parentId);
    } else if (parentType === 'supplement') {
      const { getSupplementById } = await import('./db');
      return await getSupplementById(parentId);
    } else if (parentType === 'meditation') {
      const { getMeditationRoutineById } = await import('./db');
      return await getMeditationRoutineById(parentId);
    }
    return null;
  })();
  
  if (!parent) {
    return {
      streak: 0,
      adherence: 0,
      totalDays: 0,
      daysSinceStarted: 0,
      daysSinceLastDone: null,
    };
  }
  
  const startDate = parent.start_date || parent.created_at;
  const now = Date.now();
  const daysSinceStarted = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  
  // Get all tracking events
  const allEvents = await getTrackingEventsByParent(parentType, parentId);
  const relevantEvents = scheduleId
    ? allEvents.filter(e => e.schedule_id === scheduleId)
    : allEvents;
  
  // Filter to only "taken" or "done" events
  const completedEvents = relevantEvents.filter(
    e => e.event_type === 'taken' || e.event_type === 'done'
  );
  
  // Calculate streak (consecutive days with completion)
  let streak = 0;
  const today = getStartOfDay();
  let checkDate = today;
  
  while (true) {
    const dayEvents = completedEvents.filter(e => {
      const eventDate = getStartOfDay(e.event_date);
      return eventDate === checkDate;
    });
    
    if (dayEvents.length === 0) break;
    
    streak++;
    checkDate -= 24 * 60 * 60 * 1000; // Go back one day
  }
  
  // Calculate adherence (percentage of scheduled days completed)
  const totalDays = Math.max(1, daysSinceStarted);
  const uniqueDays = new Set(
    completedEvents.map(e => getStartOfDay(e.event_date))
  ).size;
  const adherence = Math.round((uniqueDays / totalDays) * 100);
  
  // Days since last done
  const lastEvent = completedEvents[0]; // Already sorted DESC
  const daysSinceLastDone = lastEvent
    ? Math.floor((now - lastEvent.event_date) / (1000 * 60 * 60 * 24))
    : null;
  
  return {
    streak,
    adherence,
    totalDays,
    daysSinceStarted,
    daysSinceLastDone,
  };
}

// Get history aggregates for charting
export async function getHistoryAggregates(
  parentType: 'medication' | 'supplement' | 'meditation' | 'appointment',
  parentId: string,
  days: number = 30,
  scheduleId?: string
): Promise<Array<{ date: number; value: number; events: any[] }>> {
  const endDate = Date.now();
  const startDate = endDate - (days * 24 * 60 * 60 * 1000);
  
  const events = await getTrackingEventsByParent(parentType, parentId, startDate, endDate);
  const relevantEvents = scheduleId
    ? events.filter(e => e.schedule_id === scheduleId)
    : events;
  
  // Group by day
  const dayMap = new Map<number, any[]>();
  
  for (const event of relevantEvents) {
    const day = getStartOfDay(event.event_date);
    if (!dayMap.has(day)) {
      dayMap.set(day, []);
    }
    dayMap.get(day)!.push(event);
  }
  
  // Create array of daily aggregates
  const aggregates: Array<{ date: number; value: number; events: any[] }> = [];
  
  for (let i = 0; i < days; i++) {
    const date = getStartOfDay(endDate - (i * 24 * 60 * 60 * 1000));
    const dayEvents = dayMap.get(date) || [];
    
    // Value represents completion (1 = completed, 0 = not completed)
    const hasCompletion = dayEvents.some(
      e => e.event_type === 'taken' || e.event_type === 'done'
    );
    
    aggregates.unshift({
      date,
      value: hasCompletion ? 1 : 0,
      events: dayEvents,
    });
  }
  
  return aggregates;
}

// Get meditation minutes history
export async function getMeditationMinutesHistory(
  routineId: string,
  days: number = 30
): Promise<Array<{ date: number; minutes: number }>> {
  const { getMeditationLogs } = await import('./db');
  const allSessions = await getMeditationLogs();
  const routineSessions = allSessions.filter(s => s.routine_id === routineId);
  
  const endDate = Date.now();
  const startDate = endDate - (days * 24 * 60 * 60 * 1000);
  
  const relevantSessions = routineSessions.filter(
    s => s.session_date >= startDate && s.session_date <= endDate
  );
  
  // Group by day
  const dayMap = new Map<number, number>();
  
  for (const session of relevantSessions) {
    const day = getStartOfDay(session.session_date);
    const current = dayMap.get(day) || 0;
    dayMap.set(day, current + (session.duration || 0));
  }
  
  // Create array
  const history: Array<{ date: number; minutes: number }> = [];
  
  for (let i = 0; i < days; i++) {
    const date = getStartOfDay(endDate - (i * 24 * 60 * 60 * 1000));
    const minutes = dayMap.get(date) || 0;
    history.unshift({ date, minutes });
  }
  
  return history;
}

