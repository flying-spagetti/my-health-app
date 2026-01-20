import BigButton from '@/components/BigButton';
import DateTimePicker from '@/components/DateTimePicker';
import { borderRadius, shadows, spacing, tokens } from '@/constants/theme';
import { createDoseSchedule, createMedication } from '@/services/db';
import { rescheduleAllReminders } from '@/services/reminders';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

type Schedule = {
  time: Date;
  days: number[];
  dosage?: string;
};

export default function AddMedicationScreen() {
  const router = useRouter();

  // Primary
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');

  // Scheduling
  const [schedules, setSchedules] = useState<Schedule[]>([
    { time: new Date(new Date().setHours(8, 0, 0, 0)), days: EVERY_DAY },
  ]);

  // Optional
  const [showDetails, setShowDetails] = useState(false);
  const [doctor, setDoctor] = useState('');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const updateSchedule = (index: number, updates: Partial<Schedule>) => {
    const copy = [...schedules];
    copy[index] = { ...copy[index], ...updates };
    setSchedules(copy);
  };

  const toggleDay = (scheduleIndex: number, dayIndex: number) => {
    const schedule = schedules[scheduleIndex];
    const days = schedule.days.includes(dayIndex)
      ? schedule.days.filter(d => d !== dayIndex)
      : [...schedule.days, dayIndex];
    updateSchedule(scheduleIndex, { days });
  };

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      { time: new Date(new Date().setHours(20, 0, 0, 0)), days: EVERY_DAY },
    ]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'What medication is this?');
      return;
    }
    if (!dosage.trim()) {
      Alert.alert('Missing dosage', 'How much should you take?');
      return;
    }

    setIsSaving(true);
    try {
      const medId = await createMedication({
        name: name.trim(),
        dosage: dosage.trim(),
        prescribing_doctor: doctor.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      for (const schedule of schedules) {
        const h = schedule.time.getHours().toString().padStart(2, '0');
        const m = schedule.time.getMinutes().toString().padStart(2, '0');

        await createDoseSchedule({
          parent_type: 'medication',
          parent_id: medId,
          time_of_day: `${h}:${m}`,
          days_of_week: JSON.stringify(schedule.days),
          dosage: dosage.trim(),
        });
      }

      await rescheduleAllReminders(true);

      Alert.alert('Saved', 'Medication added.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not save medication.');
      // Removed for production.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.stickyFooter}>
          <BigButton title={isSaving ? 'Saving…' : 'Save'} onPress={handleSave} disabled={isSaving} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Text style={styles.title}>Add Medication</Text>
          <Text style={styles.subtitle}>We'll remind you when it's time.</Text>
        </View>

        {/* PRIMARY */}
        <View style={[styles.card, shadows.low]}>
          <Text style={styles.label}>Medication</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Metformin"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Dosage</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 500 mg"
            value={dosage}
            onChangeText={setDosage}
          />
        </View>

        {/* SCHEDULE */}
        <View style={[styles.card, shadows.low]}>
          <Text style={styles.sectionTitle}>When should we remind you?</Text>

          {schedules.map((s, i) => (
            <View key={i} style={styles.schedule}>
              <DateTimePicker
                label="Time"
                value={s.time}
                onChange={(time) => updateSchedule(i, { time })}
                mode="time"
              />

              <View style={styles.daysRow}>
                {DAYS_OF_WEEK.map((d, di) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => toggleDay(i, di)}
                    style={[
                      styles.day,
                      s.days.includes(di) && styles.daySelected,
                    ]}
                  >
                    <Text style={[
                      styles.dayText,
                      s.days.includes(di) && styles.dayTextSelected,
                    ]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {schedules.length > 1 && (
                <TouchableOpacity onPress={() => removeSchedule(i)}>
                  <Text style={styles.remove}>Remove time</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity onPress={addSchedule} style={styles.addMore}>
            <Text style={styles.addMoreText}>+ Add another time (optional)</Text>
          </TouchableOpacity>
        </View>

        {/* OPTIONAL */}
        <View style={[styles.card, shadows.low]}>
          <TouchableOpacity onPress={() => setShowDetails(v => !v)}>
            <Text style={styles.sectionTitle}>
              Details {showDetails ? '▾' : '▸'}
            </Text>
          </TouchableOpacity>

          {showDetails && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Prescribing doctor (optional)"
                value={doctor}
                onChangeText={setDoctor}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.background },
  keyboardView: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 160 },

  header: {
    marginBottom: spacing.xl,
  },
  title: { 
    fontSize: 32, 
    fontFamily: 'Caveat-SemiBold',
    color: tokens.colors.textHandwritten,
    marginBottom: spacing.xxs,
  },
  subtitle: { 
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.textMuted,
  },

  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },

  label: { 
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600', 
    color: tokens.colors.text 
  },
  input: {
    backgroundColor: tokens.colors.cardSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.text,
  },
  textArea: { minHeight: 80 },

  sectionTitle: { 
    fontSize: 16, 
    fontFamily: 'Nunito-Bold',
    fontWeight: '700', 
    color: tokens.colors.text 
  },

  schedule: { gap: spacing.sm },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  day: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  daySelected: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
  dayText: { 
    fontSize: 12, 
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600', 
    color: tokens.colors.text 
  },
  dayTextSelected: { color: tokens.colors.background },

  addMore: { paddingVertical: spacing.sm },
  addMoreText: { 
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: tokens.colors.primary, 
    fontWeight: '600' 
  },

  remove: { 
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.danger 
  },

  stickyFooter: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    zIndex: 10,
  },
});
