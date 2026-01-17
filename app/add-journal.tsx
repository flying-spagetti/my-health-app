import BigButton from '@/components/BigButton';
import DateTimePicker from '@/components/DateTimePicker';
import { borderRadius, spacing, tokens } from '@/constants/theme';
import { saveJournalEntry } from '@/services/db';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const MOODS = [
  { label: 'Happy', emoji: '😄' },
  { label: 'Calm', emoji: '😌' },
  { label: 'Focused', emoji: '🎯' },
  { label: 'Grateful', emoji: '🙏' },
  { label: 'Anxious', emoji: '😰' },
  { label: 'Stressed', emoji: '😵‍💫' },
  { label: 'Sad', emoji: '😔' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Neutral', emoji: '😐' },
];

function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionChevron}>{open ? '▾' : '▸'}</Text>
    </Pressable>
  );
}

function ScaleRow({
  label,
  value,
  onChange,
  left,
  right,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  left: string;
  right: string;
}) {
  return (
    <View style={styles.scaleRow}>
      <View style={styles.scaleTop}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.scaleValue}>{value}</Text>
      </View>
      <Slider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={tokens.colors.primary}
        maximumTrackTintColor={tokens.colors.border}
        thumbTintColor={tokens.colors.primary}
      />
      <View style={styles.scaleHints}>
        <Text style={styles.hint}>{left}</Text>
        <Text style={styles.hint}>{right}</Text>
      </View>
    </View>
  );
}

export default function AddJournalScreenV2() {
  const router = useRouter();

  // Quick log (minimal)
  const [entryDate, setEntryDate] = useState(new Date());
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoAssetId, setPhotoAssetId] = useState<string | null>(null);
  const [mood, setMood] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(6);
  const [stressLevel, setStressLevel] = useState<number>(4);
  const [sleepQuality, setSleepQuality] = useState<number>(6);
  const [note, setNote] = useState('');

  // “Add more” (collapsed by default)
  const [openMore, setOpenMore] = useState(false);
  const [sleepHours, setSleepHours] = useState('');
  const [physicalSymptoms, setPhysicalSymptoms] = useState('');
  const [exerciseType, setExerciseType] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [hydrationGlasses, setHydrationGlasses] = useState('');
  const [nutritionQuality, setNutritionQuality] = useState<number>(6);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const TAGS = useMemo(
    () => ['work', 'health', 'family', 'social', 'travel', 'food', 'exercise', 'meditation', 'creative', 'learning'],
    []
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to attach a picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setPhotoAssetId(asset.assetId ?? null);
      if (!note.trim()) setNote('Today I want to remember this moment because…');
    }
  };

  const handleSave = async () => {
    // Minimal friction: allow save with only 1 meaningful thing
    if (!mood && !note.trim() && !photoUri) {
      Alert.alert('Quick check-in', 'Pick a mood, add a note, or attach a photo—anything is enough.');
      return;
    }

    setIsLoading(true);
    try {
      await saveJournalEntry({
        mood: mood || undefined,
        energy_level: energyLevel,
        stress_level: stressLevel,
        sleep_quality: sleepQuality,
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
        physical_symptoms: physicalSymptoms.trim() || undefined,
        exercise_type: exerciseType || undefined,
        exercise_duration: exerciseDuration ? parseInt(exerciseDuration, 10) : null,
        nutrition_quality: nutritionQuality,
        hydration_glasses: hydrationGlasses ? parseInt(hydrationGlasses, 10) : null,
        note: note.trim() || undefined,
        photo_uri: photoUri || undefined,
        photo_asset_id: photoAssetId,
        tags: selectedTags,
        entry_date: entryDate.getTime(),
      });

      Alert.alert('Saved', 'Entry added.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save journal entry.');
      console.error(e);
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
        <View style={styles.stickyFooter}>
          <BigButton title={isLoading ? 'Saving…' : 'Save'} onPress={handleSave} disabled={isLoading} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <Text style={styles.title}>Quick Journal</Text>
        <Text style={styles.subtitle}>Log the day in under a minute.</Text>

        <View style={styles.card}>
          <DateTimePicker label="Entry Date" value={entryDate} onChange={setEntryDate} mode="date" />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Photo (optional)</Text>
          <Pressable style={styles.photoButton} onPress={handlePickPhoto}>
            <Text style={styles.photoButtonText}>{photoUri ? 'Change Photo' : 'Pick Photo'}</Text>
          </Pressable>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoPreview} /> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Mood</Text>
          <View style={styles.moodGrid}>
            {MOODS.map((m) => {
              const selected = mood === m.label;
              return (
                <Pressable
                  key={m.label}
                  onPress={() => setMood(selected ? '' : m.label)}
                  style={[styles.moodChip, selected && styles.moodChipSelected]}
                >
                  <Text style={[styles.moodChipText, selected && styles.moodChipTextSelected]}>
                    {m.emoji} {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <ScaleRow label="Energy" value={energyLevel} onChange={setEnergyLevel} left="Low" right="High" />
          <ScaleRow label="Stress" value={stressLevel} onChange={setStressLevel} left="Calm" right="Maxed" />
          <ScaleRow label="Sleep" value={sleepQuality} onChange={setSleepQuality} left="Poor" right="Great" />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>What’s on your mind?</Text>
          <TextInput
            style={styles.textArea}
            value={note}
            onChangeText={setNote}
            placeholder="Write a few lines… (or just one sentence)"
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <SectionHeader title="Add more (optional)" open={openMore} onToggle={() => setOpenMore((v) => !v)} />
          {openMore ? (
            <View style={{ gap: tokens.spacing.md }}>
              <TextInput
                style={styles.input}
                value={sleepHours}
                onChangeText={setSleepHours}
                placeholder="Sleep hours (e.g., 7.5)"
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.input}
                value={physicalSymptoms}
                onChangeText={setPhysicalSymptoms}
                placeholder="Symptoms (optional)"
              />
              <TextInput
                style={styles.input}
                value={exerciseType}
                onChangeText={setExerciseType}
                placeholder="Exercise type (optional)"
              />
              <TextInput
                style={styles.input}
                value={exerciseDuration}
                onChangeText={setExerciseDuration}
                placeholder="Exercise minutes (optional)"
                keyboardType="numeric"
              />

              <ScaleRow
                label="Nutrition"
                value={nutritionQuality}
                onChange={setNutritionQuality}
                left="Poor"
                right="Great"
              />

              <TextInput
                style={styles.input}
                value={hydrationGlasses}
                onChangeText={setHydrationGlasses}
                placeholder="Water glasses (optional)"
                keyboardType="numeric"
              />

              <View>
                <Text style={styles.label}>Tags</Text>
                <View style={styles.tagsRow}>
                  {TAGS.map((t) => {
                    const selected = selectedTags.includes(t);
                    return (
                      <Pressable
                        key={t}
                        onPress={() => toggleTag(t)}
                        style={[styles.tagChip, selected && styles.tagChipSelected]}
                      >
                        <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : null}
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.background },
  keyboardView: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 140 },

  title: { 
    fontSize: 32, 
    fontFamily: 'Caveat-SemiBold',
    color: tokens.colors.textHandwritten,
  },
  subtitle: { 
    marginTop: 6, 
    marginBottom: spacing.lg, 
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.textMuted,
  },

  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },

  label: { 
    fontSize: 16, 
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600', 
    color: tokens.colors.text,
  },

  input: {
    backgroundColor: tokens.colors.cardSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.text,
  },
  textArea: {
    minHeight: 110,
    backgroundColor: tokens.colors.cardSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.text,
  },

  photoButton: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  photoButtonText: { 
    color: tokens.colors.background, 
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
  },
  photoPreview: { width: '100%', height: 180, borderRadius: borderRadius.md },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moodChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.background,
  },
  moodChipSelected: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
  moodChipText: { 
    color: tokens.colors.text, 
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  moodChipTextSelected: { color: tokens.colors.background },

  scaleRow: { gap: 8 },
  scaleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scaleValue: { 
    color: tokens.colors.textMuted, 
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
  },
  scaleHints: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: { 
    color: tokens.colors.textMuted, 
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { 
    fontSize: 18, 
    fontFamily: 'Nunito-Bold',
    fontWeight: '800', 
    color: tokens.colors.text,
  },
  sectionChevron: { color: tokens.colors.textMuted, fontSize: 18, fontWeight: '900' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tagChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.background,
  },
  tagChipSelected: { backgroundColor: tokens.colors.accent, borderColor: tokens.colors.accent },
  tagChipText: { 
    color: tokens.colors.textMuted, 
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '700',
  },
  tagChipTextSelected: { color: tokens.colors.background },

  stickyFooter: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    zIndex: 10,
  },
});
