import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

interface StreakCardProps {
  streak: number;
  message: string;
  reminder?: string;
  onDismiss?: () => void;
}

export default function StreakCard({ streak, message, reminder, onDismiss }: StreakCardProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}>
      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <IconSymbol name="xmark" size={16} color={tokens.colors.textMuted} />
        </TouchableOpacity>
      )}
      
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
          <IconSymbol name="flame.fill" size={24} color="#3B82F6" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.streakText, { color: tokens.colors.text }]}>
            {streak} day streak
          </Text>
          <Text style={[styles.messageText, { color: tokens.colors.textMuted }]}>
            {message}
          </Text>
          {reminder && (
            <View style={styles.reminderContainer}>
              <IconSymbol name="star.fill" size={14} color="#F59E0B" />
              <Text style={[styles.reminderText, { color: tokens.colors.textMuted }]}>
                {reminder}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});


