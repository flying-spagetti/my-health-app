// services/reminders.ts
import * as Notifications from 'expo-notifications';
import { getMedications, getSupplements, getAppointments, getDoseSchedulesByParent, getMeditationRoutines } from './db';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Flag to prevent concurrent scheduling
let isScheduling = false;
let lastScheduleTime = 0;
const SCHEDULE_DEBOUNCE_MS = 5000; // Don't reschedule more than once every 5 seconds

// Request permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

// Cancel all notifications
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

// Schedule medication/supplement reminders
async function scheduleDoseReminders(
  parentType: 'medication' | 'supplement',
  parentId: string,
  parentName: string,
  scheduleId: string,
  timeOfDay: string,
  daysOfWeek: number[],
  dosage: string
) {
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const now = Date.now();
  
  // Schedule for next 7 days only (to reduce notification spam)
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const dayOfWeek = date.getDay();
    
    if (!daysOfWeek.includes(dayOfWeek)) continue;
    
    date.setHours(hours, minutes, 0, 0);
    const scheduledTime = date.getTime();
    
    // Skip if time has passed today
    if (dayOffset === 0 && scheduledTime < now) {
      continue;
    }
    
    // Create unique identifier with date
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const notificationId = `${parentType}-${parentId}-${scheduleId}-${dateStr}`;
    
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: `Time to take ${parentName}`,
          body: `Dosage: ${dosage}`,
          sound: true,
          data: {
            type: parentType,
            parentId,
            scheduleId,
          },
        },
        trigger: {
          date: scheduledTime,
        },
      });
    } catch (error) {
      console.error(`Error scheduling notification ${notificationId}:`, error);
    }
  }
}

// Schedule appointment reminders
async function scheduleAppointmentReminders() {
  const appointments = await getAppointments();
  const now = Date.now();
  
  for (const apt of appointments) {
    if (apt.is_completed || apt.appointment_date < now) continue;
    
    // Remind 1 day before
    const reminderDate = new Date(apt.appointment_date - 24 * 60 * 60 * 1000);
    if (reminderDate > new Date()) {
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `appointment-${apt.id}-reminder-${reminderDate.getTime()}`,
          content: {
            title: 'Appointment Reminder',
            body: `You have an appointment with ${apt.doctor_name} tomorrow`,
            sound: true,
            data: {
              type: 'appointment',
              appointmentId: apt.id,
            },
          },
          trigger: {
            date: reminderDate,
          },
        });
      } catch (error) {
        console.error(`Error scheduling appointment reminder:`, error);
      }
    }
    
    // Remind 1 hour before
    const hourReminder = new Date(apt.appointment_date - 60 * 60 * 1000);
    if (hourReminder > new Date()) {
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `appointment-${apt.id}-hour-${hourReminder.getTime()}`,
          content: {
            title: 'Appointment in 1 hour',
            body: `${apt.doctor_name}${apt.specialty ? ` - ${apt.specialty}` : ''}`,
            sound: true,
            data: {
              type: 'appointment',
              appointmentId: apt.id,
            },
          },
          trigger: {
            date: hourReminder,
          },
        });
      } catch (error) {
        console.error(`Error scheduling hour reminder:`, error);
      }
    }
  }
}

// Schedule meditation reminders (only if there are active routines)
async function scheduleMeditationReminders() {
  const routines = await getMeditationRoutines(true);
  
  // Only schedule if there are active routines
  if (routines.length === 0) {
    return;
  }
  
  // Schedule for next 7 days only
  const defaultTime = new Date();
  defaultTime.setHours(20, 0, 0, 0); // 8 PM
  
  if (defaultTime < new Date()) {
    defaultTime.setDate(defaultTime.getDate() + 1);
  }
  
  for (let i = 0; i < 7; i++) {
    const reminderDate = new Date(defaultTime);
    reminderDate.setDate(reminderDate.getDate() + i);
    const dateStr = reminderDate.toISOString().split('T')[0];
    
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `meditation-reminder-${dateStr}`,
        content: {
          title: 'Time for Meditation',
          body: 'Take a moment to practice mindfulness',
          sound: true,
          data: {
            type: 'meditation',
          },
        },
        trigger: {
          date: reminderDate.getTime(),
        },
      });
    } catch (error) {
      console.error(`Error scheduling meditation reminder:`, error);
    }
  }
}

// Reschedule all reminders (with debouncing)
export async function rescheduleAllReminders() {
  // Prevent concurrent scheduling
  if (isScheduling) {
    console.log('Scheduling already in progress, skipping...');
    return;
  }
  
  // Debounce: don't reschedule if called too recently
  const now = Date.now();
  if (now - lastScheduleTime < SCHEDULE_DEBOUNCE_MS) {
    console.log('Rescheduling debounced, too soon since last schedule');
    return;
  }
  
  isScheduling = true;
  lastScheduleTime = now;
  
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return;
    }
    
    // Cancel all existing notifications first
    await cancelAllNotifications();
    
    // Small delay to ensure cancellation is processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Schedule medication reminders
    const medications = await getMedications(true);
    for (const med of medications) {
      const schedules = await getDoseSchedulesByParent('medication', med.id);
      for (const schedule of schedules) {
        try {
          const daysOfWeek = JSON.parse(schedule.days_of_week) as number[];
          await scheduleDoseReminders(
            'medication',
            med.id,
            med.name,
            schedule.id,
            schedule.time_of_day,
            daysOfWeek,
            schedule.dosage || med.dosage
          );
        } catch (error) {
          console.error(`Error scheduling medication ${med.id}:`, error);
        }
      }
    }
    
    // Schedule supplement reminders
    const supplements = await getSupplements(true);
    for (const supp of supplements) {
      const schedules = await getDoseSchedulesByParent('supplement', supp.id);
      for (const schedule of schedules) {
        try {
          const daysOfWeek = JSON.parse(schedule.days_of_week) as number[];
          await scheduleDoseReminders(
            'supplement',
            supp.id,
            supp.name,
            schedule.id,
            schedule.time_of_day,
            daysOfWeek,
            schedule.dosage || supp.dosage
          );
        } catch (error) {
          console.error(`Error scheduling supplement ${supp.id}:`, error);
        }
      }
    }
    
    // Schedule appointment reminders
    await scheduleAppointmentReminders();
    
    // Schedule meditation reminders (only if routines exist)
    await scheduleMeditationReminders();
    
    // Get count of scheduled notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Successfully scheduled ${scheduled.length} notifications`);
    
    // Log breakdown for debugging
    const medCount = scheduled.filter(n => n.content.data?.type === 'medication' || n.content.data?.type === 'supplement').length;
    const aptCount = scheduled.filter(n => n.content.data?.type === 'appointment').length;
    const meditCount = scheduled.filter(n => n.content.data?.type === 'meditation').length;
    console.log(`Breakdown: ${medCount} meds/supplements, ${aptCount} appointments, ${meditCount} meditation`);
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  } finally {
    isScheduling = false;
  }
}

// Cancel reminders for a specific item
export async function cancelItemReminders(
  parentType: 'medication' | 'supplement' | 'meditation' | 'appointment',
  parentId: string
) {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of allNotifications) {
      const data = notification.content.data;
      if (data?.parentId === parentId || data?.appointmentId === parentId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Error cancelling item reminders:', error);
  }
}
