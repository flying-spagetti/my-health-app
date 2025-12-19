
import { Pedometer } from 'expo-sensors';

export async function getTodayStepCount(): Promise<number> {
  const isAvailable = await Pedometer.isAvailableAsync();
  if (!isAvailable) {
    return 0;
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();

  try {
    const result = await Pedometer.getStepCountAsync(start, end);
    return result.steps;
  } catch (e) {
    // Android currently does not support getStepCountAsync for a date range.
    console.warn('Step count not available on this platform yet, defaulting to 0.', e);
    return 0;
  }
}
