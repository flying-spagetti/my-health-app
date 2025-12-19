import BigButton from '@/components/BigButton';
import { tokens } from '@/constants/theme';
import { saveMigraineReading } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SEVERITY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TRIGGERS = ['Stress', 'Weather', 'Hormones', 'Sleep', 'Food', 'Light', 'Noise', 'Exercise'];
const SYMPTOMS = ['Headache', 'Nausea', 'Sensitivity to Light', 'Sensitivity to Sound', 'Aura', 'Dizziness', 'Fatigue'];

export default function AddMigraineScreen() {
  const router = useRouter();
  const [severity, setSeverity] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev => 
      prev.includes(trigger) 
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSave = async () => {
    if (!severity) {
      Alert.alert('Error', 'Please select a severity level');
      return;
    }

    setIsLoading(true);
    try {
      await saveMigraineReading({
        severity,
        note: note.trim(),
        started_at: Date.now(),
        triggers: JSON.stringify(selectedTriggers),
        symptoms: JSON.stringify(selectedSymptoms),
      });
      
      Alert.alert('Success', 'Migraine episode recorded!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save migraine episode. Please try again.');
      console.error('Error saving migraine reading:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Migraine Episode</Text>
          <Text style={styles.subtitle}>Record your migraine episode details</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Severity Level (1-10) *</Text>
            <View style={styles.severityContainer}>
              {SEVERITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.severityButton,
                    severity === level && styles.severityButtonSelected
                  ]}
                  onPress={() => setSeverity(level)}
                >
                  <Text style={[
                    styles.severityButtonText,
                    severity === level && styles.severityButtonTextSelected
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Triggers</Text>
            <View style={styles.tagsContainer}>
              {TRIGGERS.map((trigger) => (
                <TouchableOpacity
                  key={trigger}
                  style={[
                    styles.tagButton,
                    selectedTriggers.includes(trigger) && styles.tagButtonSelected
                  ]}
                  onPress={() => toggleTrigger(trigger)}
                >
                  <Text style={[
                    styles.tagButtonText,
                    selectedTriggers.includes(trigger) && styles.tagButtonTextSelected
                  ]}>
                    {trigger}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Symptoms</Text>
            <View style={styles.tagsContainer}>
              {SYMPTOMS.map((symptom) => (
                <TouchableOpacity
                  key={symptom}
                  style={[
                    styles.tagButton,
                    selectedSymptoms.includes(symptom) && styles.tagButtonSelected
                  ]}
                  onPress={() => toggleSymptom(symptom)}
                >
                  <Text style={[
                    styles.tagButtonText,
                    selectedSymptoms.includes(symptom) && styles.tagButtonTextSelected
                  ]}>
                    {symptom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Additional notes about this migraine episode..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <Text style={styles.disclaimer}>
          If your migraine is severe, new, or different from usual, seek medical care. This app is
          for personal tracking only and does not replace professional advice.
        </Text>

        <View style={styles.footer}>
          <BigButton 
            title={isLoading ? "Saving..." : "Save Episode"} 
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
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  severityButton: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.borderRadius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    minWidth: 40,
    alignItems: 'center',
  },
  severityButtonSelected: {
    backgroundColor: tokens.colors.danger,
    borderColor: tokens.colors.danger,
  },
  severityButtonText: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
    fontWeight: '600',
  },
  severityButtonTextSelected: {
    color: tokens.colors.bg,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  tagButton: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  tagButtonSelected: {
    backgroundColor: tokens.colors.accent,
    borderColor: tokens.colors.accent,
  },
  tagButtonText: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.textMuted,
  },
  tagButtonTextSelected: {
    color: tokens.colors.bg,
    fontWeight: '600',
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
  disclaimer: {
    marginTop: tokens.spacing.md,
    fontSize: tokens.typography.caption,
    color: tokens.colors.textMuted,
  },
});