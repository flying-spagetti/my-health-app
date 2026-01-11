/**
 * MoodCalendar Component
 * 
 * A monthly calendar visualization showing mood entries as colored dots.
 * Matches the design.json aesthetic with rounded corners and soft colors.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  getThemeTokens, 
  getMoodColor,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { IconSymbol } from '@/components/ui/icon-symbol';

type MoodEntry = {
  id: string;
  entry_date: number;
  mood?: string | null;
  mood_intensity?: number | null;
};

type MoodCalendarProps = {
  entries: MoodEntry[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
};

export function MoodCalendar({ 
  entries, 
  selectedDate,
  onDateSelect,
  onMonthChange,
}: MoodCalendarProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  // Get calendar data for the current month
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Create calendar grid (6 weeks max)
    const weeks: Array<Array<{ date: Date | null; mood: string | null; hasEntry: boolean; isToday: boolean }>> = [];
    let currentWeek: Array<{ date: Date | null; mood: string | null; hasEntry: boolean; isToday: boolean }> = [];
    
    // Add empty cells for days before the first
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push({ date: null, mood: null, hasEntry: false, isToday: false });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      
      // Find mood entry for this date
      const entry = entries.find(e => {
        const entryDate = new Date(e.entry_date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      });
      
      currentWeek.push({
        date,
        mood: entry?.mood || null,
        hasEntry: !!entry,
        isToday: date.getTime() === today.getTime(),
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Fill remaining cells
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: null, mood: null, hasEntry: false, isToday: false });
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [currentMonth, entries]);

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.card }, shadows.low]}>
      {/* Month Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <IconSymbol name="chevron.left" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: tokens.colors.text }]}>
          {monthName}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <IconSymbol name="chevron.right" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Day Labels */}
      <View style={styles.dayLabelsRow}>
        {dayLabels.map((label, index) => (
          <View key={index} style={styles.dayLabelCell}>
            <Text style={[styles.dayLabel, { color: tokens.colors.textMuted }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      {calendarData.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => (
            <TouchableOpacity
              key={dayIndex}
              style={styles.dayCell}
              onPress={() => day.date && onDateSelect?.(day.date)}
              disabled={!day.date}
            >
              {day.date && (
                <View
                  style={[
                    styles.dayCircle,
                    day.hasEntry && { backgroundColor: getMoodColor(day.mood || 'calm') },
                    !day.hasEntry && { backgroundColor: 'transparent' },
                    day.isToday && styles.todayRing,
                    day.isToday && { borderColor: tokens.colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: day.hasEntry ? tokens.colors.textOnDark : tokens.colors.text },
                      !day.hasEntry && { color: tokens.colors.textMuted },
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getMoodColor('joyful') }]} />
          <Text style={[styles.legendText, { color: tokens.colors.textMuted }]}>Joyful</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getMoodColor('calm') }]} />
          <Text style={[styles.legendText, { color: tokens.colors.textMuted }]}>Calm</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getMoodColor('anxious') }]} />
          <Text style={[styles.legendText, { color: tokens.colors.textMuted }]}>Anxious</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: getMoodColor('sad') }]} />
          <Text style={[styles.legendText, { color: tokens.colors.textMuted }]}>Sad</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navButton: {
    padding: spacing.xs,
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-SemiBold',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Medium',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: {
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
  },
});

export default MoodCalendar;
