import BigButton from '@/components/BigButton';
import { getThemeTokens } from '@/constants/theme';
import { createAppointment } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddAppointmentScreen() {
  const router = useRouter();
  const tokens = getThemeTokens('dark');
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [appointmentType, setAppointmentType] = useState<'visit' | 'followup'>('visit');
  const [dateTime, setDateTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!doctorName.trim()) {
      Alert.alert('Error', 'Please enter a doctor name');
      return;
    }

    if (!dateTime.trim()) {
      Alert.alert('Error', 'Please enter appointment date and time');
      return;
    }

    // Parse date time string (expecting format like "2024-12-25 14:30")
    let appointmentDate: number;
    try {
      const [datePart, timePart] = dateTime.trim().split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart ? timePart.split(':').map(Number) : [12, 0];
      appointmentDate = new Date(year, month - 1, day, hours, minutes).getTime();
      
      if (isNaN(appointmentDate)) {
        throw new Error('Invalid date');
      }
    } catch {
      Alert.alert('Error', 'Please enter date and time in format: YYYY-MM-DD HH:MM');
      return;
    }

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
      
      Alert.alert('Success', 'Appointment added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save appointment. Please try again.');
      console.error('Error saving appointment:', error);
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
            <Text style={styles.label}>Date & Time *</Text>
            <TextInput
              style={styles.input}
              value={dateTime}
              onChangeText={setDateTime}
              placeholder="YYYY-MM-DD HH:MM (e.g., 2024-12-25 14:30)"
              keyboardType="default"
            />
            <Text style={styles.hint}>
              Format: YYYY-MM-DD HH:MM (24-hour format)
            </Text>
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
    height: 100,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  typeButton: {
    flex: 1,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  typeButtonText: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
    fontWeight: '600',
  },
  typeButtonTextSelected: {
    color: tokens.colors.bg,
  },
  hint: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.textMuted,
    marginTop: tokens.spacing.xs,
  },
  footer: {
    paddingTop: tokens.spacing.lg,
  },
});

