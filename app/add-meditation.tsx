import BigButton from '@/components/BigButton';
import { tokens } from '@/constants/theme';
import { createMeditationRoutine, saveMeditationLog } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const MEDITATION_TYPES = ['Mindfulness', 'Breathing', 'Body Scan', 'Loving Kindness', 'Walking', 'Guided'];
const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export default function AddMeditationScreen() {
  const router = useRouter();
  const [routineName, setRoutineName] = useState('');
  const [targetMinutes, setTargetMinutes] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'routine' | 'session'>('routine');

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    setIsLoading(true);
    try {
      await createMeditationRoutine({
        name: routineName.trim(),
        target_minutes: targetMinutes,
        notes: notes.trim() || undefined,
      });
      
      Alert.alert('Success', 'Meditation routine added! Track your daily practice.', [
        { text: 'OK', onPress: () => router.push('/(tabs)') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save meditation routine. Please try again.');
      console.error('Error saving meditation routine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSession = async () => {
    if (!targetMinutes) {
      Alert.alert('Error', 'Please select a duration');
      return;
    }

    setIsLoading(true);
    try {
      await saveMeditationLog({ 
        duration: targetMinutes,
        meditation_type: 'Mindfulness',
        note: notes.trim(),
        session_date: Date.now(),
      });
      
      Alert.alert('Success', 'Meditation session logged!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save meditation session. Please try again.');
      console.error('Error saving meditation session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Meditation</Text>
          <Text style={styles.subtitle}>
            {mode === 'routine' ? 'Create a daily meditation routine' : 'Log a meditation session'}
          </Text>
        </View>

        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'routine' && styles.modeButtonSelected]}
            onPress={() => setMode('routine')}
          >
            <Text style={[styles.modeButtonText, mode === 'routine' && styles.modeButtonTextSelected]}>
              Create Routine
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'session' && styles.modeButtonSelected]}
            onPress={() => setMode('session')}
          >
            <Text style={[styles.modeButtonText, mode === 'session' && styles.modeButtonTextSelected]}>
              Log Session
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'routine' ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Routine Name *</Text>
              <TextInput
                style={styles.input}
                value={routineName}
                onChangeText={setRoutineName}
                placeholder="e.g., Morning Meditation, Evening Calm"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Minutes Per Day *</Text>
              <View style={styles.durationContainer}>
                {DURATION_OPTIONS.map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.durationButton,
                      targetMinutes === minutes && styles.durationButtonSelected
                    ]}
                    onPress={() => setTargetMinutes(minutes)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      targetMinutes === minutes && styles.durationButtonTextSelected
                    ]}>
                      {minutes}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional notes about this routine..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.footer}>
              <BigButton 
                title={isLoading ? "Saving..." : "Create Routine"} 
                onPress={handleSaveRoutine}
                disabled={isLoading}
              />
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Duration (minutes) *</Text>
              <View style={styles.durationContainer}>
                {DURATION_OPTIONS.map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.durationButton,
                      targetMinutes === minutes && styles.durationButtonSelected
                    ]}
                    onPress={() => setTargetMinutes(minutes)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      targetMinutes === minutes && styles.durationButtonTextSelected
                    ]}>
                      {minutes}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How did the session go? Any insights or observations..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.footer}>
              <BigButton 
                title={isLoading ? "Saving..." : "Save Session"} 
                onPress={handleSaveSession}
                disabled={isLoading}
              />
            </View>
          </View>
        )}
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
  modeSelector: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  modeButton: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center',
  },
  modeButtonSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  modeButtonText: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
    fontWeight: '600',
  },
  modeButtonTextSelected: {
    color: tokens.colors.bg,
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
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  durationButton: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.borderRadius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    minWidth: 60,
    alignItems: 'center',
  },
  durationButtonSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  durationButtonText: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
    fontWeight: '600',
  },
  durationButtonTextSelected: {
    color: tokens.colors.bg,
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
    height: 100,
  },
  footer: {
    paddingTop: tokens.spacing.lg,
  },
});
