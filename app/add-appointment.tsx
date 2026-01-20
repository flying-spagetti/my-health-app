import BigButton from '@/components/BigButton';
import DateTimePicker from '@/components/DateTimePicker';
import { borderRadius, spacing, tokens } from '@/constants/theme';
import { createAppointment } from '@/services/db';
import { rescheduleAllReminders } from '@/services/reminders';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddAppointmentScreen() {
  const router = useRouter();
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [appointmentType, setAppointmentType] = useState<'visit' | 'followup'>('visit');
  const [dateTime, setDateTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!doctorName.trim()) {
      Alert.alert('Error', 'Please enter a doctor name');
      return;
    }

    const appointmentDate = dateTime.getTime();

    setIsLoading(true);
    try {
      await createAppointment({
        doctor_name: doctorName.trim(),
        specialty: specialty.trim() || undefined,
        location: location.trim() || undefined,
        appointment_date: appointmentDate,
        appointment_type: appointmentType,
        notes: notes.trim() || undefined,
      });
      
      // Reschedule reminders (force reschedule since we added a new item)
      await rescheduleAllReminders(true);
      
      Alert.alert('Success', 'Appointment added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save appointment. Please try again.');
      // Removed for production.error('Error saving appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Appointment</Text>
          <Text style={styles.subtitle}>Schedule a doctor visit or follow-up</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doctor Name *</Text>
            <TextInput
              style={styles.input}
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder="e.g., Dr. Smith"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Specialty</Text>
            <TextInput
              style={styles.input}
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="e.g., Cardiology, General Practice"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Hospital name or address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Appointment Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  appointmentType === 'visit' && styles.typeButtonSelected
                ]}
                onPress={() => setAppointmentType('visit')}
              >
                <Text style={[
                  styles.typeButtonText,
                  appointmentType === 'visit' && styles.typeButtonTextSelected
                ]}>
                  Visit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  appointmentType === 'followup' && styles.typeButtonSelected
                ]}
                onPress={() => setAppointmentType('followup')}
              >
                <Text style={[
                  styles.typeButtonText,
                  appointmentType === 'followup' && styles.typeButtonTextSelected
                ]}>
                  Follow-up
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <DateTimePicker
              label="Date & Time *"
              value={dateTime}
              onChange={setDateTime}
              mode="datetime"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes about this appointment..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <BigButton 
            title={isLoading ? "Saving..." : "Save Appointment"} 
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
    backgroundColor: tokens.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
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
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
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
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    height: 100,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    backgroundColor: tokens.colors.surface,
    borderRadius: borderRadius.full,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: tokens.colors.text,
    fontWeight: '600',
  },
  typeButtonTextSelected: {
    color: tokens.colors.background,
  },
  footer: {
    paddingTop: spacing.lg,
  },
});

