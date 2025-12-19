import BigButton from '@/components/BigButton';
import { tokens } from '@/constants/theme';
import { saveBPReading } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AddBPScreen() {
  const router = useRouter();
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!systolic || !diastolic) {
      Alert.alert('Error', 'Please enter both systolic and diastolic values');
      return;
    }

    const systolicNum = parseInt(systolic);
    const diastolicNum = parseInt(diastolic);
    const pulseNum = pulse ? parseInt(pulse) : null;

    if (isNaN(systolicNum) || isNaN(diastolicNum) || (pulse && isNaN(pulseNum!))) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    if (systolicNum < 50 || systolicNum > 300 || diastolicNum < 30 || diastolicNum > 200) {
      Alert.alert('Error', 'Please enter realistic blood pressure values');
      return;
    }

    setIsLoading(true);
    try {
      await saveBPReading({
        systolic: systolicNum,
        diastolic: diastolicNum,
        pulse: pulseNum,
        note: note.trim(),
        measured_at: Date.now(),
      });
      
      Alert.alert('Success', 'Blood pressure reading saved!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save reading. Please try again.');
      console.error('Error saving BP reading:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Blood Pressure</Text>
          <Text style={styles.subtitle}>Record your latest blood pressure reading</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Systolic (mmHg) *</Text>
            <TextInput
              style={styles.input}
              value={systolic}
              onChangeText={setSystolic}
              placeholder="120"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Diastolic (mmHg) *</Text>
            <TextInput
              style={styles.input}
              value={diastolic}
              onChangeText={setDiastolic}
              placeholder="80"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pulse (BPM)</Text>
            <TextInput
              style={styles.input}
              value={pulse}
              onChangeText={setPulse}
              placeholder="72"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Any additional notes..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <Text style={styles.disclaimer}>
          This app does not provide medical advice. If you are concerned about your blood pressure,
          contact a healthcare professional.
        </Text>

        <View style={styles.footer}>
          <BigButton 
            title={isLoading ? "Saving..." : "Save Reading"} 
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
  footer: {
    paddingTop: tokens.spacing.lg,
  },
  disclaimer: {
    marginTop: tokens.spacing.md,
    fontSize: tokens.typography.caption,
    color: tokens.colors.textMuted,
  },
});
