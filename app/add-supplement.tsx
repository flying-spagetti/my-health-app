import BigButton from '@/components/BigButton';
import { tokens } from '@/constants/theme';
import { createSupplement, createDoseSchedule } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AddSupplementScreen() {
  const router = useRouter();
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
      
      Alert.alert('Success', 'Supplement added! We\'ll remind you when it\'s due.', [
        { text: 'OK', onPress: () => router.push('/(tabs)') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save supplement. Please try again.');
      console.error('Error saving supplement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Supplement</Text>
          <Text style={styles.subtitle}>Set up supplement tracking with schedules</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supplement Name *</Text>
            <TextInput
              style={styles.input}
              value={supplementName}
              onChangeText={setSupplementName}
              placeholder="e.g., Vitamin D, Omega-3, Magnesium"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dosage *</Text>
            <TextInput
              style={styles.input}
              value={dosage}
              onChangeText={setDosage}
              placeholder="e.g., 1000mg, 2 capsules, 1 tablet"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Schedules *</Text>
            {schedules.map((schedule, index) => (
              <View key={index} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleLabel}>Schedule {index + 1}</Text>
                  {schedules.length > 1 && (
                    <TouchableOpacity onPress={() => removeSchedule(index)}>
                      <Text style={styles.removeButton}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Time:</Text>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    value={schedule.time}
                    onChangeText={(time) => updateSchedule(index, { time })}
                    placeholder="08:00"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.daysContainer}>
                  <Text style={styles.daysLabel}>Days:</Text>
                  <View style={styles.daysRow}>
                    {DAYS_OF_WEEK.map((day, dayIndex) => (
                      <TouchableOpacity
                        key={dayIndex}
                        style={[
                          styles.dayButton,
                          schedule.days.includes(dayIndex) && styles.dayButtonSelected
                        ]}
                        onPress={() => toggleDay(index, dayIndex)}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          schedule.days.includes(dayIndex) && styles.dayButtonTextSelected
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ))}
            
            <TouchableOpacity style={styles.addScheduleButton} onPress={addSchedule}>
              <Text style={styles.addScheduleText}>+ Add Another Schedule</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <Text style={styles.disclaimer}>
          This app is for tracking only and does not provide medical advice. Talk to your doctor
          before starting or changing supplements.
        </Text>

        <View style={styles.footer}>
          <BigButton 
            title={isLoading ? "Saving..." : "Save Supplement"} 
            onPress={handleSave}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bg,
  },
  content: {
    flexGrow: 1,
    padding: tokens.spacing.lg,
  },
  header: {
    marginBottom: tokens.spacing.xl,
  },
  title: {
    fontSize: tokens.typography.h1,
    fontWeight: '700',
    color: tokens.colors.text,
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    fontSize: tokens.typography.body,
    color: tokens.colors.textMuted,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: tokens.spacing.lg,
  },
  label: {
    fontSize: tokens.typography.body,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: tokens.spacing.sm,
  },
  input: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  textArea: {
    height: 80,
  },
  scheduleCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  scheduleLabel: {
    fontSize: tokens.typography.body,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  removeButton: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.danger,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  timeLabel: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
    marginRight: tokens.spacing.sm,
  },
  timeInput: {
    flex: 1,
    maxWidth: 100,
  },
  daysContainer: {
    marginTop: tokens.spacing.sm,
  },
  daysLabel: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
    marginBottom: tokens.spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  dayButton: {
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.card,
    minWidth: 40,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  dayButtonText: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text,
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: tokens.colors.bg,
  },
  addScheduleButton: {
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderStyle: 'dashed',
    borderRadius: tokens.borderRadius.md,
  },
  addScheduleText: {
    fontSize: tokens.typography.body,
    color: tokens.colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingTop: tokens.spacing.lg,
  },
  disclaimer: {
    marginTop: tokens.spacing.md,
    fontSize: tokens.typography.caption,
    color: tokens.colors.textMuted,
  },
});
