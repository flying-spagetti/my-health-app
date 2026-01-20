import BigButton from '@/components/BigButton';
import DateTimePicker from '@/components/DateTimePicker';
import { spacing, tokens } from '@/constants/theme';
import { saveBPReading } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AddBPScreen() {
  const router = useRouter();
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [note, setNote] = useState('');
  const [measuredAt, setMeasuredAt] = useState(new Date());
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
        measured_at: measuredAt.getTime(),
      });
      
      Alert.alert('Success', 'Blood pressure reading saved!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save reading. Please try again.');
      // Removed for production.error('Error saving BP reading:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
        <Text style={[styles.title, { color: tokens.colors.textHandwritten }]}>
          Add Blood Pressure
          </Text>
          <Text style={styles.subtitle}>Record your latest blood pressure reading</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <DateTimePicker
              label="Date & Time"
              value={measuredAt}
              onChange={setMeasuredAt}
              mode="datetime"
            />
          </View>

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

        <View style={styles.footer}>
          <BigButton 
            title={isLoading ? "Saving..." : "Save Reading"} 
            onPress={handleSave}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxxl,
  },
  header: {
    marginBottom: tokens.spacing.xl,
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
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: tokens.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: tokens.colors.cardSecondary,
    borderRadius: tokens.borderRadius.lg,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
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
