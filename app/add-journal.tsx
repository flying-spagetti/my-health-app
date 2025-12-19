import BigButton from '@/components/BigButton';
import { tokens } from '@/constants/theme';
import { saveJournalEntry } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const MOODS = ['Happy', 'Sad', 'Anxious', 'Calm', 'Energetic', 'Tired', 'Focused', 'Stressed'];
const TAGS = ['work', 'exercise', 'social', 'family', 'health', 'travel', 'food', 'weather'];

export default function AddJournalScreen() {
  const router = useRouter();
  const [mood, setMood] = useState('');
  const [energyLevel, setEnergyLevel] = useState('');
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!note.trim()) {
      Alert.alert('Error', 'Please write something in your journal entry');
      return;
    }

    if (energyLevel && (isNaN(parseInt(energyLevel)) || parseInt(energyLevel) < 1 || parseInt(energyLevel) > 10)) {
      Alert.alert('Error', 'Energy level must be between 1 and 10');
      return;
    }

    setIsLoading(true);
    try {
      await saveJournalEntry({
        mood,
        energy_level: energyLevel ? parseInt(energyLevel, 10) : null,
        note: note.trim(),
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
          <Text style={styles.title}>Add Journal Entry</Text>
          <Text style={styles.subtitle}>Record your thoughts and feelings</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>How are you feeling?</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Energy Level (1-10)</Text>
            <TextInput
              style={styles.input}
              value={energyLevel}
              onChangeText={setEnergyLevel}
              placeholder="7"
              keyboardType="numeric"
              maxLength={2}
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Journal Entry *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="How was your day? What are you grateful for? Any thoughts you'd like to remember..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
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
  inputGroup: {
    marginBottom: tokens.spacing.lg,
  },
  label: {
    fontSize: tokens.typography.body,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: tokens.spacing.sm,
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
