
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import BigButton from './BigButton';
import { tokens } from '@/constants/theme';

interface BPFormProps {
  onSave: (reading: { systolic: number; diastolic: number; pulse: number }) => void;
}

export default function BPForm({ onSave }: BPFormProps) {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');

  const handleSave = () => {
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    const p = parseInt(pulse, 10);
    if (!isNaN(sys) && !isNaN(dia) && !isNaN(p)) {
      onSave({ systolic: sys, diastolic: dia, pulse: p });
    }
  };

  return (
    <View>
      <Text style={styles.label}>Systolic</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={systolic}
        onChangeText={setSystolic}
      />
      <Text style={styles.label}>Diastolic</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={diastolic}
        onChangeText={setDiastolic}
      />
      <Text style={styles.label}>Pulse</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={pulse}
        onChangeText={setPulse}
      />
      <BigButton title="Save" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: tokens.colors.text,
    marginBottom: tokens.spacing.sm,
  },
  input: {
    backgroundColor: tokens.colors.card,
    color: tokens.colors.text,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
    fontSize: 18,
  },
});
