import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { tokens } from '@/constants/theme';
import { IconSymbol } from './ui/icon-symbol';

interface DateTimePickerComponentProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  label?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}

export default function DateTimePickerComponent({
  value,
  onChange,
  mode = 'datetime',
  label,
  minimumDate,
  maximumDate,
  disabled = false,
}: DateTimePickerComponentProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>(
    mode === 'datetime' ? 'date' : mode
  );

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateTime = (date: Date): string => {
    if (mode === 'date') {
      return formatDate(date);
    }
    if (mode === 'time') {
      return formatTime(date);
    }
    return `${formatDate(date)} ${formatTime(date)}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      if (mode === 'datetime' && pickerMode === 'date') {
        // After selecting date, show time picker
        const newDate = new Date(selectedDate);
        newDate.setHours(value.getHours());
        newDate.setMinutes(value.getMinutes());
        onChange(newDate);
        
        if (Platform.OS === 'ios') {
          setPickerMode('time');
        } else {
          // On Android, show time picker next
          setTimeout(() => {
            setPickerMode('time');
            setShowPicker(true);
          }, 100);
        }
      } else if (mode === 'datetime' && pickerMode === 'time') {
        // After selecting time, update the date with new time
        const newDate = new Date(value);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        onChange(newDate);
        
        // On iOS, keep picker open so user can click "Done"
        // On Android, close picker
        if (Platform.OS === 'android') {
          setShowPicker(false);
          setPickerMode('date'); // Reset for next time
        }
      } else {
        onChange(selectedDate);
        if (Platform.OS === 'android') {
          setShowPicker(false);
        }
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
      if (mode === 'datetime' && pickerMode === 'time') {
        setPickerMode('date');
      }
    }
  };

  const openPicker = () => {
    if (disabled) return;
    setPickerMode(mode === 'datetime' ? 'date' : mode);
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.input, disabled && styles.inputDisabled]}
        onPress={openPicker}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.inputText, disabled && styles.inputTextDisabled]}>
          {formatDateTime(value)}
        </Text>
        <IconSymbol name="calendar" size={20} color={tokens.colors.textMuted} />
      </TouchableOpacity>

      {showPicker && (
        <>
          {Platform.OS === 'ios' ? (
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity
                  onPress={() => {
                    if (mode === 'datetime' && pickerMode === 'time') {
                      setPickerMode('date');
                    } else {
                      setShowPicker(false);
                    }
                  }}
                >
                  <Text style={styles.iosPickerButton}>
                    {mode === 'datetime' && pickerMode === 'time' ? 'Back' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                {mode === 'datetime' && (
                  <Text style={styles.iosPickerTitle}>
                    {pickerMode === 'date' ? 'Select Date' : 'Select Time'}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={() => {
                    if (mode === 'datetime' && pickerMode === 'date') {
                      setPickerMode('time');
                    } else {
                      setShowPicker(false);
                      if (mode === 'datetime' && pickerMode === 'time') {
                        setPickerMode('date'); // Reset for next time
                      }
                    }
                  }}
                >
                  <Text style={[styles.iosPickerButton, styles.iosPickerButtonDone]}>
                    {mode === 'datetime' && pickerMode === 'date' ? 'Next' : 'Done'}
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value}
                mode={pickerMode}
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                textColor={tokens.colors.text}
              />
            </View>
          ) : (
            <DateTimePicker
              value={value}
              mode={pickerMode}
              display="default"
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    fontSize: tokens.typography.body,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: tokens.spacing.sm,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  inputText: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
    flex: 1,
  },
  inputTextDisabled: {
    color: tokens.colors.textMuted,
  },
  iosPickerContainer: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  iosPickerTitle: {
    fontSize: tokens.typography.body,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  iosPickerButton: {
    fontSize: tokens.typography.body,
    color: tokens.colors.textMuted,
  },
  iosPickerButtonDone: {
    color: tokens.colors.primary,
    fontWeight: '600',
  },
});
