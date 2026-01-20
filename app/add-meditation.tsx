import BigButton from '@/components/BigButton';
import DateTimePicker from '@/components/DateTimePicker';
import { borderRadius, shadows, spacing, tokens } from '@/constants/theme';
import { createMeditationRoutine, saveMeditationLog } from '@/services/db';
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

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export default function AddMeditationScreen() {
  const router = useRouter();

  // Session (primary)
  const [duration, setDuration] = useState<number>(10);
  const [sessionDate, setSessionDate] = useState(new Date());
  const [notes, setNotes] = useState('');

  // Optional routine
  const [showRoutine, setShowRoutine] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [targetMinutes, setTargetMinutes] = useState<number>(10);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!duration) {
      Alert.alert('Missing duration', 'How long was your session?');
      return;
    }

    setIsSaving(true);
    try {
      // Always save the session
      await saveMeditationLog({
        duration,
        meditation_type: 'Mindfulness',
        note: notes.trim() || undefined,
        session_date: sessionDate.getTime(),
      });

      // Optionally create routine
      if (showRoutine && routineName.trim()) {
        await createMeditationRoutine({
          name: routineName.trim(),
          target_minutes: targetMinutes,
          notes: undefined,
        });
      }

      Alert.alert('Saved', 'Meditation logged.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not save meditation.');
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
          <BigButton
            title={isSaving ? 'Saving…' : 'Save'}
            onPress={handleSave}
            disabled={isSaving}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Text style={styles.title}>Meditation</Text>
          <Text style={styles.subtitle}>Log your practice.</Text>
        </View>

        {/* SESSION */}
        <View style={[styles.card, shadows.low]}>
          <Text style={styles.sectionTitle}>How long did you meditate?</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setDuration(m)}
                style={[
                  styles.durationChip,
                  duration === m && styles.durationChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.durationText,
                    duration === m && styles.durationTextSelected,
                  ]}
                >
                  {m}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <DateTimePicker
            label="When"
            value={sessionDate}
            onChange={setSessionDate}
            mode="datetime"
          />
        </View>

        {/* NOTES */}
        <View style={[styles.card, shadows.low]}>
          <Text style={styles.sectionTitle}>Reflection (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="How did it feel?"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {/* ROUTINE */}
        <View style={[styles.card, shadows.low]}>
          <TouchableOpacity onPress={() => setShowRoutine(v => !v)}>
            <Text style={styles.sectionTitle}>
              Make this a routine {showRoutine ? '▾' : '▸'}
            </Text>
          </TouchableOpacity>

          {showRoutine && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Routine name (e.g. Morning Calm)"
                value={routineName}
                onChangeText={setRoutineName}
              />

              <Text style={styles.label}>Daily target</Text>
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setTargetMinutes(m)}
                    style={[
                      styles.durationChip,
                      targetMinutes === m && styles.durationChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        targetMinutes === m && styles.durationTextSelected,
                      ]}
                    >
                      {m}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.textMuted,
  },

  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },

  sectionTitle: { 
    fontSize: 16, 
    fontFamily: 'Nunito-Bold',
    fontWeight: '700', 
    color: tokens.colors.text 
  },
  label: { 
    fontSize: 14, 
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600', 
    color: tokens.colors.text 
  },

  input: {
    backgroundColor: tokens.colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.text,
  },
  textArea: { minHeight: 80 },

  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  durationChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  durationChipSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  durationText: { 
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600', 
    color: tokens.colors.text 
  },
  durationTextSelected: { color: tokens.colors.background },

  stickyFooter: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    zIndex: 10,
  },
});
