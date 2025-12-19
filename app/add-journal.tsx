import BigButton from '@/components/BigButton';
import { tokens } from '@/constants/theme';
import { saveJournalEntry } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const MOODS = ['Happy', 'Calm', 'Energetic', 'Focused', 'Grateful', 'Anxious', 'Stressed', 'Sad', 'Tired', 'Irritated', 'Neutral', 'Excited'];
const EXERCISE_TYPES = ['Walking', 'Running', 'Cycling', 'Yoga', 'Strength Training', 'Swimming', 'Dance', 'Sports', 'Other'];
const WEATHER_OPTIONS = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Cold', 'Hot', 'Humid', 'Clear'];
const SOCIAL_ACTIVITIES = ['Alone', 'Family', 'Friends', 'Colleagues', 'Partner', 'Group Activity', 'Social Event'];

export default function AddJournalScreen() {
  const router = useRouter();
  const [mood, setMood] = useState('');
  const [moodIntensity, setMoodIntensity] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [physicalSymptoms, setPhysicalSymptoms] = useState('');
  const [socialActivity, setSocialActivity] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [exerciseType, setExerciseType] = useState('');
  const [nutritionQuality, setNutritionQuality] = useState<number | null>(null);
  const [hydrationGlasses, setHydrationGlasses] = useState('');
  const [weather, setWeather] = useState('');
  const [location, setLocation] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [goalsAchieved, setGoalsAchieved] = useState('');
  const [challenges, setChallenges] = useState('');
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const TAGS = ['work', 'health', 'family', 'social', 'travel', 'food', 'exercise', 'meditation', 'creative', 'learning'];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const renderScaleSelector = (
    label: string,
    value: number | null,
    setValue: (val: number | null) => void,
    minLabel: string,
    maxLabel: string
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.scaleContainer}>
        <Text style={styles.scaleLabel}>{minLabel}</Text>
        <View style={styles.scaleButtons}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.scaleButton,
                value === num && styles.scaleButtonSelected
              ]}
              onPress={() => setValue(value === num ? null : num)}
            >
              <Text style={[
                styles.scaleButtonText,
                value === num && styles.scaleButtonTextSelected
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.scaleLabel}>{maxLabel}</Text>
      </View>
    </View>
  );

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await saveJournalEntry({
        mood: mood || undefined,
        mood_intensity: moodIntensity,
        energy_level: energyLevel,
        stress_level: stressLevel,
        sleep_quality: sleepQuality,
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
        physical_symptoms: physicalSymptoms.trim() || undefined,
        social_activity: socialActivity || undefined,
        exercise_duration: exerciseDuration ? parseInt(exerciseDuration, 10) : null,
        exercise_type: exerciseType || undefined,
        nutrition_quality: nutritionQuality,
        hydration_glasses: hydrationGlasses ? parseInt(hydrationGlasses, 10) : null,
        weather: weather || undefined,
        location: location.trim() || undefined,
        gratitude: gratitude.trim() || undefined,
        goals_achieved: goalsAchieved.trim() || undefined,
        challenges: challenges.trim() || undefined,
        note: note.trim() || undefined,
        tags: selectedTags,
        entry_date: Date.now(),
      });

      Alert.alert('Success', 'Journal entry saved!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
      console.error('Error saving journal entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Comprehensive Journal Entry</Text>
          <Text style={styles.subtitle}>Record your complete state and well-being</Text>
        </View>

        <View style={styles.form}>
          {/* Mood & Emotional State */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood & Emotional State</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Primary Mood</Text>
              <View style={styles.moodContainer}>
                {MOODS.map((moodOption) => (
                  <TouchableOpacity
                    key={moodOption}
                    style={[
                      styles.moodButton,
                      mood === moodOption && styles.moodButtonSelected
                    ]}
                    onPress={() => setMood(moodOption)}
                  >
                    <Text style={[
                      styles.moodButtonText,
                      mood === moodOption && styles.moodButtonTextSelected
                    ]}>
                      {moodOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderScaleSelector(
              'Mood Intensity',
              moodIntensity,
              setMoodIntensity,
              'Mild',
              'Intense'
            )}

            {renderScaleSelector(
              'Energy Level',
              energyLevel,
              setEnergyLevel,
              'Low',
              'High'
            )}

            {renderScaleSelector(
              'Stress Level',
              stressLevel,
              setStressLevel,
              'Calm',
              'Very Stressed'
            )}
          </View>

          {/* Physical Wellness */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physical Wellness</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Physical Symptoms</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                value={physicalSymptoms}
                onChangeText={setPhysicalSymptoms}
                placeholder="e.g., Headache, muscle tension, fatigue..."
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {renderScaleSelector(
              'Sleep Quality (Last Night)',
              sleepQuality,
              setSleepQuality,
              'Poor',
              'Excellent'
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sleep Hours</Text>
              <TextInput
                style={styles.input}
                value={sleepHours}
                onChangeText={setSleepHours}
                placeholder="e.g., 7.5"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Activity & Exercise */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity & Exercise</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Exercise Type</Text>
              <View style={styles.exerciseContainer}>
                {EXERCISE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.exerciseButton,
                      exerciseType === type && styles.exerciseButtonSelected
                    ]}
                    onPress={() => setExerciseType(exerciseType === type ? '' : type)}
                  >
                    <Text style={[
                      styles.exerciseButtonText,
                      exerciseType === type && styles.exerciseButtonTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Exercise Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={exerciseDuration}
                onChangeText={setExerciseDuration}
                placeholder="e.g., 30"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Nutrition & Hydration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition & Hydration</Text>
            
            {renderScaleSelector(
              'Nutrition Quality',
              nutritionQuality,
              setNutritionQuality,
              'Poor',
              'Excellent'
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Water Intake (glasses)</Text>
              <TextInput
                style={styles.input}
                value={hydrationGlasses}
                onChangeText={setHydrationGlasses}
                placeholder="e.g., 8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Social & Environment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social & Environment</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Social Activity</Text>
              <View style={styles.socialContainer}>
                {SOCIAL_ACTIVITIES.map((activity) => (
                  <TouchableOpacity
                    key={activity}
                    style={[
                      styles.socialButton,
                      socialActivity === activity && styles.socialButtonSelected
                    ]}
                    onPress={() => setSocialActivity(socialActivity === activity ? '' : activity)}
                  >
                    <Text style={[
                      styles.socialButtonText,
                      socialActivity === activity && styles.socialButtonTextSelected
                    ]}>
                      {activity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weather</Text>
              <View style={styles.weatherContainer}>
                {WEATHER_OPTIONS.map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[
                      styles.weatherButton,
                      weather === w && styles.weatherButtonSelected
                    ]}
                    onPress={() => setWeather(weather === w ? '' : w)}
                  >
                    <Text style={[
                      styles.weatherButtonText,
                      weather === w && styles.weatherButtonTextSelected
                    ]}>
                      {w}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., Home, Office, Park..."
              />
            </View>
          </View>

          {/* Reflection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reflection</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gratitude</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                value={gratitude}
                onChangeText={setGratitude}
                placeholder="What are you grateful for today?"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goals Achieved</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                value={goalsAchieved}
                onChangeText={setGoalsAchieved}
                placeholder="What did you accomplish today?"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Challenges</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                value={challenges}
                onChangeText={setChallenges}
                placeholder="What challenges did you face?"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Free-form Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Journal Entry</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={note}
                onChangeText={setNote}
                placeholder="Any additional thoughts, reflections, or details you'd like to remember..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagsContainer}>
                {TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagButton,
                      selectedTags.includes(tag) && styles.tagButtonSelected
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[
                      styles.tagButtonText,
                      selectedTags.includes(tag) && styles.tagButtonTextSelected
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <BigButton 
            title={isLoading ? "Saving..." : "Save Entry"} 
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
  section: {
    marginBottom: tokens.spacing.xl,
    paddingBottom: tokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  sectionTitle: {
    fontSize: tokens.typography.h3,
    fontWeight: '600',
    color: tokens.colors.text,
    marginBottom: tokens.spacing.md,
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
    height: 120,
  },
  textAreaSmall: {
    height: 60,
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  moodButton: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.borderRadius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  moodButtonSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  moodButtonText: {
    fontSize: tokens.typography.body,
    color: tokens.colors.text,
  },
  moodButtonTextSelected: {
    color: tokens.colors.bg,
    fontWeight: '600',
  },
  scaleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  scaleLabel: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.textMuted,
    minWidth: 50,
  },
  scaleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: tokens.spacing.xs,
  },
  scaleButton: {
    width: 32,
    height: 32,
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleButtonSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  scaleButtonText: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text,
    fontWeight: '600',
  },
  scaleButtonTextSelected: {
    color: tokens.colors.bg,
  },
  exerciseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  exerciseButton: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  exerciseButtonSelected: {
    backgroundColor: tokens.colors.accent,
    borderColor: tokens.colors.accent,
  },
  exerciseButtonText: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text,
  },
  exerciseButtonTextSelected: {
    color: tokens.colors.bg,
    fontWeight: '600',
  },
  socialContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  socialButton: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  socialButtonSelected: {
    backgroundColor: tokens.colors.accent,
    borderColor: tokens.colors.accent,
  },
  socialButtonText: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text,
  },
  socialButtonTextSelected: {
    color: tokens.colors.bg,
    fontWeight: '600',
  },
  weatherContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  weatherButton: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  weatherButtonSelected: {
    backgroundColor: tokens.colors.accent,
    borderColor: tokens.colors.accent,
  },
  weatherButtonText: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.text,
  },
  weatherButtonTextSelected: {
    color: tokens.colors.bg,
    fontWeight: '600',
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
  footer: {
    paddingTop: tokens.spacing.lg,
  },
});
