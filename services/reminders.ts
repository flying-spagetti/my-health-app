// services/reminders.ts
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAppointments, getDoseSchedulesByParent, getMedications, getMeditationRoutines, getSupplements } from './db';

// Check if we're in Expo Go (where notifications have limitations)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Configure notification handler (only if notifications are available)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  // Silently handle if notifications aren't available (e.g., in Expo Go)
  // Could not set notification handler
}

// Set up Android notification channels (required for Android 8.0+)
async function setupAndroidChannels() {
  if (Platform.OS === 'android') {
    try {
      // Medication & Supplement channel
      await Notifications.setNotificationChannelAsync('medications', {
        name: 'Medications & Supplements',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        description: 'Reminders for your medications and supplements',
      });

      // Appointments channel
      await Notifications.setNotificationChannelAsync('appointments', {
        name: 'Appointments',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        description: 'Reminders for your doctor appointments',
      });

      // Meditation channel
      await Notifications.setNotificationChannelAsync('meditation', {
        name: 'Meditation',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        description: 'Reminders for your meditation practice',
      });

      // Android notification channels set up successfully
    } catch (error) {
      // Error setting up Android notification channels
    }
  }
}

// Flag to prevent concurrent scheduling
let isScheduling = false;
let lastScheduleTime = 0;
const SCHEDULE_DEBOUNCE_MS = 5000; // Don't reschedule more than once every 5 seconds

// Request permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  // In Expo Go, local notifications should still work, but we'll handle gracefully
  if (isExpoGo) {
    // Running in Expo Go - notifications may have limitations
  }
  
  try {
    // Set up Android channels first
    await setupAndroidChannels();
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // For iOS, request provisional permissions if not granted
    if (Platform.OS === 'ios' && finalStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    // Handle cases where notifications aren't available
    // Notification permissions not available (this is normal in Expo Go for remote notifications)
    // Local scheduled notifications should still work in Expo Go
    return false;
  }
}

// Cancel all notifications
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    // All notifications cancelled
  } catch (error) {
    // Silently handle errors (e.g., when notifications aren't available in Expo Go)
    // Could not cancel notifications (may not be available in Expo Go)
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
  
  // Schedule for next 30 days (local app, so we can schedule further ahead)
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
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
      const triggerDate = new Date(scheduledTime);
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
          ...(Platform.OS === 'android' && {
            channelId: 'medications',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          }),
        },
        trigger: { type: 'date', date: triggerDate },
      });
    } catch (error) {
      // Error scheduling notification
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
            ...(Platform.OS === 'android' && {
              channelId: 'appointments',
              priority: Notifications.AndroidNotificationPriority.HIGH,
            }),
          },
          trigger: { type: 'date', date: reminderDate },
        });
      } catch (error) {
        // Error scheduling appointment reminder
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
            ...(Platform.OS === 'android' && {
              channelId: 'appointments',
              priority: Notifications.AndroidNotificationPriority.HIGH,
            }),
          },
          trigger: { type: 'date', date: hourReminder },
        });
      } catch (error) {
        // Error scheduling hour reminder
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
  
  // Schedule for next 30 days
  const defaultTime = new Date();
  defaultTime.setHours(20, 0, 0, 0); // 8 PM
  
  if (defaultTime < new Date()) {
    defaultTime.setDate(defaultTime.getDate() + 1);
  }
  
  for (let i = 0; i < 30; i++) {
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
          ...(Platform.OS === 'android' && {
            channelId: 'meditation',
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          }),
        },
        trigger: { type: 'date', date: reminderDate },
      });
    } catch (error) {
      // Error scheduling meditation reminder
    }
  }
}

// Clean up expired notifications
async function cleanupExpiredNotifications() {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const notification of allNotifications) {
      // Check if notification trigger date has passed
      const triggerDate = notification.trigger as any;
      if (triggerDate?.date && triggerDate.date < now) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      // Cleaned up expired notifications
    }
  } catch (error) {
    // Error cleaning up expired notifications
  }
}

// Check if rescheduling is needed (only reschedule if notifications are missing or outdated)
async function needsRescheduling(): Promise<boolean> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    
    // Check if we have notifications scheduled for the next 30 days
    const futureNotifications = scheduled.filter(n => {
      const triggerDate = (n.trigger as any)?.date;
      return triggerDate && triggerDate > now && triggerDate <= thirtyDaysFromNow;
    });
    
    // If we have very few notifications scheduled, we need to reschedule
    if (futureNotifications.length < 10) {
      return true;
    }
    
    // Check if we have medications/supplements that need scheduling
    const medications = await getMedications(true);
    const supplements = await getSupplements(true);
    
    if (medications.length === 0 && supplements.length === 0) {
      return false;
    }
    
    // Count how many medication/supplement notifications we have
    const medSuppNotifications = scheduled.filter(n => {
      const data = n.content.data;
      return data?.type === 'medication' || data?.type === 'supplement';
    });
    
    // Estimate expected count: each med/supp with schedule should have ~30 notifications (one per day for 30 days)
    let expectedCount = 0;
    for (const med of medications) {
      const schedules = await getDoseSchedulesByParent('medication', med.id);
      // Calculate how many days per week this schedule runs
      for (const schedule of schedules) {
        const daysOfWeek = JSON.parse(schedule.days_of_week) as number[];
        // Approximate: 30 days / 7 days per week * number of days per week
        expectedCount += Math.ceil((30 / 7) * daysOfWeek.length);
      }
    }
    for (const supp of supplements) {
      const schedules = await getDoseSchedulesByParent('supplement', supp.id);
      for (const schedule of schedules) {
        const daysOfWeek = JSON.parse(schedule.days_of_week) as number[];
        expectedCount += Math.ceil((30 / 7) * daysOfWeek.length);
      }
    }
    
    // If we have significantly fewer notifications than expected, reschedule
    return medSuppNotifications.length < expectedCount * 0.5;
  } catch (error) {
    // In Expo Go, notifications might not be fully available
    if (isExpoGo) {
      // Removed for production.warn('Could not check notification status (Expo Go limitation) - will attempt to reschedule');
    } else {
      // Removed for production.error('Error checking if rescheduling needed:', error);
    }
    return true; // Default to rescheduling on error
  }
}

// Reschedule all reminders (with debouncing and smart rescheduling)
export async function rescheduleAllReminders(force: boolean = false) {
  // Prevent concurrent scheduling
  if (isScheduling) {
    // Removed for production.log('Scheduling already in progress, skipping...');
    return;
  }
  
  // Debounce: don't reschedule if called too recently (unless forced)
  const now = Date.now();
  if (!force && now - lastScheduleTime < SCHEDULE_DEBOUNCE_MS) {
    // Removed for production.log('Rescheduling debounced, too soon since last schedule');
    return;
  }
  
  isScheduling = true;
  lastScheduleTime = now;
  
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      if (isExpoGo) {
        // Removed for production.log('Running in Expo Go - local notifications may still work but permissions may be limited');
        // Continue anyway - local notifications might still work
      } else {
        // Removed for production.log('Notification permissions not granted');
        return;
      }
    }
    
    // Clean up expired notifications first (don't cancel all)
    await cleanupExpiredNotifications();
    
    // Check if rescheduling is actually needed (unless forced)
    let shouldReschedule = force;
    if (!force) {
      const needsReschedule = await needsRescheduling();
      if (!needsReschedule) {
        // Removed for production.log('Notifications are up to date, skipping reschedule');
        isScheduling = false;
        return;
      }
      shouldReschedule = true;
    }
    
    // Cancel and reschedule if needed (to avoid duplicates)
    if (shouldReschedule) {
      await cancelAllNotifications();
      // Small delay to ensure cancellation is processed
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
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
          // Removed for production.error(`Error scheduling medication ${med.id}:`, error);
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
          // Removed for production.error(`Error scheduling supplement ${supp.id}:`, error);
        }
      }
    }
    
    // Schedule appointment reminders
    await scheduleAppointmentReminders();
    
    // Schedule meditation reminders (only if routines exist)
    await scheduleMeditationReminders();
    
    // Get count of scheduled notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    // Removed for production.log(`Successfully scheduled ${scheduled.length} notifications`);
    
    // Log breakdown for debugging
    const medCount = scheduled.filter(n => n.content.data?.type === 'medication' || n.content.data?.type === 'supplement').length;
    const aptCount = scheduled.filter(n => n.content.data?.type === 'appointment').length;
    const meditCount = scheduled.filter(n => n.content.data?.type === 'meditation').length;
    // Removed for production.log(`Breakdown: ${medCount} meds/supplements, ${aptCount} appointments, ${meditCount} meditation`);
  } catch (error) {
    // Removed for production.error('Error scheduling reminders:', error);
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
    // Removed for production.error('Error cancelling item reminders:', error);
  }
}

// Badge management functions
export async function setBadgeCount(count: number) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    // Removed for production.error('Error setting badge count:', error);
  }
}

export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    // Removed for production.error('Error getting badge count:', error);
    return 0;
  }
}

export async function clearBadge() {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    // Removed for production.error('Error clearing badge:', error);
  }
}

export async function incrementBadge() {
  try {
    const current = await Notifications.getBadgeCountAsync();
    await Notifications.setBadgeCountAsync(current + 1);
  } catch (error) {
    // Removed for production.error('Error incrementing badge:', error);
  }
}

// Get all scheduled notifications (useful for debugging)
export async function getScheduledNotificationsCount(): Promise<number> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
  } catch (error) {
    // Removed for production.error('Error getting scheduled notifications:', error);
    return 0;
  }
}

// Get scheduled notifications by type
export async function getScheduledNotificationsByType(type: string) {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return allNotifications.filter(n => n.content.data?.type === type);
  } catch (error) {
    // Removed for production.error('Error getting scheduled notifications by type:', error);
    return [];
  }
}
