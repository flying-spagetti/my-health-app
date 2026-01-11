/**
 * Add Supplement Screen
 * 
 * Form to add a new supplement with scheduling options.
 */

import BigButton from '@/components/BigButton';
import { getThemeTokens, spacing, borderRadius, shadows } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { createSupplement, createDoseSchedule } from '@/services/db';
import { rescheduleAllReminders } from '@/services/reminders';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Alert, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AddSupplementScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  
  const [supplementName, setSupplementName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [schedules, setSchedules] = useState<Array<{ time: string; days: number[]; dosage?: string }>>([
    { time: '08:00', days: [1, 2, 3, 4, 5, 6, 0] }, // Default: every day at 8 AM
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const addSchedule = () => {
    setSchedules([...schedules, { time: '12:00', days: [1, 2, 3, 4, 5, 6, 0] }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, updates: Partial<{ time: string; days: number[]; dosage: string }>) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], ...updates };
    setSchedules(newSchedules);
  };

  const toggleDay = (scheduleIndex: number, dayIndex: number) => {
    const schedule = schedules[scheduleIndex];
    const days = schedule.days.includes(dayIndex)
      ? schedule.days.filter(d => d !== dayIndex)
      : [...schedule.days, dayIndex];
    updateSchedule(scheduleIndex, { days });
  };

  const handleSave = async () => {
    if (!supplementName.trim()) {
      Alert.alert('Error', 'Please enter a supplement name');
      return;
    }

    if (!dosage.trim()) {
      Alert.alert('Error', 'Please enter the dosage');
      return;
    }

    if (schedules.length === 0) {
      Alert.alert('Error', 'Please add at least one schedule');
      return;
    }

    for (const schedule of schedules) {
      if (!schedule.time.match(/^\d{2}:\d{2}$/)) {
        Alert.alert('Error', 'Please enter time in HH:MM format (e.g., 08:00)');
        return;
      }
      if (schedule.days.length === 0) {
        Alert.alert('Error', 'Please select at least one day for each schedule');
        return;
      }
    }

    setIsLoading(true);
    try {
      const suppId = await createSupplement({
        name: supplementName.trim(),
        dosage: dosage.trim(),
        notes: notes.trim() || undefined,
      });

      // Create schedules
      for (const schedule of schedules) {
        await createDoseSchedule({
          parent_type: 'supplement',
          parent_id: suppId,
          time_of_day: schedule.time,
          days_of_week: JSON.stringify(schedule.days),
          dosage: schedule.dosage || dosage.trim(),
        });
      }
      
      // Reschedule reminders (force reschedule since we added a new item)
      await rescheduleAllReminders(true);
      
      Alert.alert('Success', 'Supplement added! We\'ll remind you when it\'s due.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save supplement. Please try again.');
      console.error('Error saving supplement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: tokens.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.textHandwritten }]}>
            Add Supplement
          </Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
            Set up supplement tracking with schedules
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: tokens.colors.text }]}>
              Supplement Name *
            </Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: tokens.colors.card,
                  color: tokens.colors.text,
                  borderColor: tokens.colors.border,
                }
              ]}
              value={supplementName}
              onChangeText={setSupplementName}
              placeholder="e.g., Vitamin D, Omega-3, Magnesium"
              placeholderTextColor={tokens.colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: tokens.colors.text }]}>
              Dosage *
            </Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: tokens.colors.card,
                  color: tokens.colors.text,
                  borderColor: tokens.colors.border,
                }
              ]}
              value={dosage}
              onChangeText={setDosage}
              placeholder="e.g., 1000mg, 2 capsules, 1 tablet"
              placeholderTextColor={tokens.colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: tokens.colors.text }]}>
              Schedules *
            </Text>
            {schedules.map((schedule, index) => (
              <View 
                key={index} 
                style={[
                  styles.scheduleCard, 
                  { 
                    backgroundColor: tokens.colors.surface,
                    borderColor: tokens.colors.border,
                  }
                ]}
              >
                <View style={styles.scheduleHeader}>
                  <Text style={[styles.scheduleLabel, { color: tokens.colors.text }]}>
                    Schedule {index + 1}
                  </Text>
                  {schedules.length > 1 && (
                    <TouchableOpacity onPress={() => removeSchedule(index)}>
                      <Text style={[styles.removeButton, { color: tokens.colors.danger }]}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.timeRow}>
                  <Text style={[styles.timeLabel, { color: tokens.colors.text }]}>
                    Time:
                  </Text>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.timeInput,
                      { 
                        backgroundColor: tokens.colors.card,
                        color: tokens.colors.text,
                        borderColor: tokens.colors.border,
                      }
                    ]}
                    value={schedule.time}
                    onChangeText={(time) => updateSchedule(index, { time })}
                    placeholder="08:00"
                    placeholderTextColor={tokens.colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.daysContainer}>
                  <Text style={[styles.daysLabel, { color: tokens.colors.text }]}>
                    Days:
                  </Text>
                  <View style={styles.daysRow}>
                    {DAYS_OF_WEEK.map((day, dayIndex) => (
                      <TouchableOpacity
                        key={dayIndex}
                        style={[
                          styles.dayButton,
                          { 
                            borderColor: tokens.colors.border,
                            backgroundColor: tokens.colors.card,
                          },
                          schedule.days.includes(dayIndex) && { 
                            backgroundColor: tokens.colors.primary,
                            borderColor: tokens.colors.primary,
                          }
                        ]}
                        onPress={() => toggleDay(index, dayIndex)}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          { color: tokens.colors.text },
                          schedule.days.includes(dayIndex) && { color: '#FFFFFF' }
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ))}
            
            <TouchableOpacity 
              style={[styles.addScheduleButton, { borderColor: tokens.colors.border }]} 
              onPress={addSchedule}
            >
              <Text style={[styles.addScheduleText, { color: tokens.colors.primary }]}>
                + Add Another Schedule
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: tokens.colors.text }]}>
              Notes
            </Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea,
                { 
                  backgroundColor: tokens.colors.card,
                  color: tokens.colors.text,
                  borderColor: tokens.colors.border,
                }
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              placeholderTextColor={tokens.colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <Text style={[styles.disclaimer, { color: tokens.colors.textMuted }]}>
          This app is for tracking only and does not provide medical advice. Talk to your doctor
          before starting or changing supplements.
        </Text>

        <View style={styles.footer}>
          <BigButton 
            title={isLoading ? "Saving..." : "Save Supplement"} 
            onPress={handleSave}
            disabled={isLoading}
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Caveat-SemiBold',
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    borderWidth: 1,
  },
  textArea: {
    height: 80,
  },
  scheduleCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scheduleLabel: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
  },
  removeButton: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timeLabel: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    marginRight: spacing.sm,
  },
  timeInput: {
    flex: 1,
    maxWidth: 100,
  },
  daysContainer: {
    marginTop: spacing.sm,
  },
  daysLabel: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    marginBottom: spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  dayButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
  },
  addScheduleButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
  },
  addScheduleText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
  },
  footer: {
    paddingTop: spacing.lg,
  },
  disclaimer: {
    marginTop: spacing.md,
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
});
