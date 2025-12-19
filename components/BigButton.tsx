// src/components/BigButton.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { tokens } from '../constants/theme';

interface BigButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function BigButton({ title, onPress, disabled = false }: BigButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.btn, disabled && styles.btnDisabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.txt, disabled && styles.txtDisabled]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: tokens.colors.primary,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.md,
    alignItems: 'center',
    ...tokens.shadows.sm,
  },
  btnDisabled: {
    backgroundColor: tokens.colors.textMuted,
    opacity: 0.6,
  },
  txt: { 
    color: tokens.colors.bg, 
    fontWeight: '600', 
    fontSize: tokens.typography.body 
  },
  txtDisabled: {
    color: tokens.colors.textMuted,
  },
});
