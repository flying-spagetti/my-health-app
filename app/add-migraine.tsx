import BigButton from '@/components/BigButton';
import DateTimePicker from '@/components/DateTimePicker';
import { borderRadius, shadows, spacing, tokens } from '@/constants/theme';
import {
  getMigraineReadings,
  saveMigraineReading,
  updateMigraineReading,
} from '@/services/db';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/* ======================================================
   ENHANCED ICHD-3 ALIGNED CONSTANTS
====================================================== */

const PAIN_LOCATION_SPECIFIC = [
  'Frontal (forehead)',
  'Temporal (temples)',
  'Occipital (back of head)',
  'Retro-orbital (behind eyes)',
  'Vertex (top of head)',
];

const PAIN_LATERALITY = [
  'Left side only',
  'Right side only',
  'Both sides (bilateral)',
  'Switches sides during attack',
];

const PAIN_QUALITY = [
  'Throbbing/pulsating',
  'Pressure/tightness',
  'Sharp/stabbing',
  'Dull/aching',
];

const AURA_TYPES = [
  'Visual (zigzags, blind spots)',
  'Sensory (tingling, numbness)',
  'Speech/language difficulty',
  'Motor weakness',
  'Brainstem (vertigo, tinnitus)',
];

const AURA_DURATION_OPTIONS = [
  '5-15 minutes',
  '15-30 minutes',
  '30-45 minutes',
  '45-60 minutes',
  '>60 minutes (atypical)',
];

const ASSOCIATED_SYMPTOMS = [
  'Dizziness/vertigo',
  'Osmophobia (smell sensitivity)',
  'Neck pain/stiffness',
  'Blurred vision',
  'Confusion/brain fog',
];

const PRODROME_SYMPTOMS = [
  'Neck stiffness/pain',
  'Excessive yawning',
  'Mood changes (irritable/euphoric)',
  'Food cravings',
  'Fatigue',
  'Difficulty concentrating',
  'Increased urination',
  'Constipation/diarrhea',
];

const POSTDROME_SYMPTOMS = [
  'Extreme fatigue',
  'Difficulty concentrating',
  'Mood changes',
  'Weakness',
  'Dizziness',
  'Scalp tenderness',
  'Cognitive impairment',
];

const TRIGGERS = [
  'Stress/anxiety',
  'Poor/insufficient sleep',
  'Oversleeping',
  'Skipped meals/fasting',
  'Dehydration',
  'Alcohol',
  'Caffeine (too much)',
  'Caffeine withdrawal',
  'Weather changes',
  'Bright/flickering lights',
  'Strong odors',
  'Loud sounds',
  'Physical exertion',
  'Menstruation',
];

const FOOD_TRIGGERS = [
  'Aged cheese',
  'Chocolate',
  'Alcohol (red wine)',
  'Alcohol (beer)',
  'Processed meats (nitrates)',
  'MSG (monosodium glutamate)',
  'Artificial sweeteners',
  'Citrus fruits',
  'Nuts',
  'Caffeine',
  'Fermented foods',
];

const SLEEP_QUALITY = [
  'Excellent - Well rested',
  'Good - Adequate rest',
  'Fair - Some rest',
  'Poor - Little rest',
  'Very poor - No rest',
];

const TIME_TO_PEAK_OPTIONS = [
  '<30 minutes (very rapid)',
  '30-60 minutes (rapid)',
  '1-2 hours (moderate)',
  '2-4 hours (gradual)',
  '>4 hours (very gradual)',
];

const MEDICATION_TYPE = [
  'Rescue/Abortive',
  'Preventive',
  'Both',
];

const RELIEF_TIMEPOINTS = [
  '30 minutes',
  '1 hour',
  '2 hours',
  '4 hours',
];

const PAIN_RELIEF_LEVELS = [
  'No relief',
  'Minimal relief (25%)',
  'Moderate relief (50%)',
  'Good relief (75%)',
  'Complete relief (100%)',
];

const SEVERITY_LABELS = [
  'None',
  'Very mild - barely noticeable',
  'Mild - noticeable but not limiting',
  'Mild-moderate - some interference',
  'Moderate - interferes with activities',
  'Moderate-severe - difficult to ignore',
  'Severe - significant impairment',
  'Very severe - very difficult to function',
  'Extremely severe - incapacitating',
  'Near maximum - barely manageable',
  'Maximum - worst imaginable',
];

const DISABILITY_FUNCTIONAL = [
  'No impact - normal activities',
  'Minimal - slight interference',
  'Mild - some activities limited',
  'Moderate - many activities limited',
  'Severe - most activities impossible',
  'Complete - bed-bound',
];

/* ======================================================
   MIDAS QUESTIONNAIRE (Last 3 Months)
====================================================== */

interface MidasData {
  missedWorkDays: string;
  reducedProductivityDays: string;
  missedHouseholdDays: string;
  reducedHouseholdDays: string;
  missedSocialDays: string;
}

function calculateMidasScore(data: MidasData): number {
  const total = 
    (parseInt(data.missedWorkDays) || 0) +
    (parseInt(data.reducedProductivityDays) || 0) +
    (parseInt(data.missedHouseholdDays) || 0) +
    (parseInt(data.reducedHouseholdDays) || 0) +
    (parseInt(data.missedSocialDays) || 0);
  return total;
}

function getMidasGrade(score: number): string {
  if (score <= 5) return 'Grade I: Little or no disability';
  if (score <= 10) return 'Grade II: Mild disability';
  if (score <= 20) return 'Grade III: Moderate disability';
  return 'Grade IV: Severe disability';
}

/* ======================================================
   MIGRAINE CLASSIFICATION (ICHD-3)
====================================================== */

function classifyMigraine(data: any, previousEntries: any[]) {
  const now = Date.now();
  const last30Days = previousEntries.filter(
    e => e.started_at >= now - 30 * 24 * 60 * 60 * 1000
  );

  const headacheDays = new Set(
    [...last30Days, data].map(e =>
      new Date(e.started_at).toDateString()
    )
  ).size;

  const migraineDays = [...last30Days, data].filter(
    e => e.severity >= 5 || e.aura_present
  ).length;

  // ICHD-3 criteria check (stricter)
  const hasUnilateralPain = data.pain_laterality?.includes('Left side') || 
                            data.pain_laterality?.includes('Right side') ||
                            data.pain_laterality?.includes('Switches');
  
  const hasPulsatingQuality = data.pain_quality?.includes('Throbbing/pulsating');
  
  const hasPhotoPhono = data.photophobia || data.phonophobia;
  const hasNauseaVomit = data.nausea || data.vomiting;
  
  const hasModerateToSevere = data.severity >= 5;
  const worsenedByActivity = data.worsened_by_movement === true;

  // Count ICHD-3 criteria met (need at least 2 of 4 pain characteristics)
  let painCriteria = 0;
  if (hasUnilateralPain) painCriteria++;
  if (hasPulsatingQuality) painCriteria++;
  if (hasModerateToSevere) painCriteria++;
  if (worsenedByActivity) painCriteria++;

  const meetsIchd3 = painCriteria >= 2 && (hasPhotoPhono || hasNauseaVomit);

  return {
    classification:
      headacheDays >= 15 && migraineDays >= 8
        ? 'Chronic Migraine (≥15 headache days/month)'
        : 'Episodic Migraine (<15 headache days/month)',
    headache_days_30: headacheDays,
    migraine_days_30: migraineDays,
    meets_ichd3: meetsIchd3,
    ichd3_criteria_met: painCriteria,
    type: data.aura_present ? 'Migraine with Aura' : 'Migraine without Aura',
  };
}

/* ======================================================
   MAIN SCREEN
====================================================== */

export default function AddMigraineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const episodeId = params.episodeId as string | undefined;
  const isEditing = !!episodeId;

  /* -------- QUICK LOG MODE -------- */
  const [isQuickLog, setIsQuickLog] = useState(!isEditing);
  const [isCompleted, setIsCompleted] = useState(false);

  /* -------- Timing -------- */
  const [startedAt, setStartedAt] = useState(new Date());
  const [isOngoing, setIsOngoing] = useState(true);
  const [endedAt, setEndedAt] = useState<Date | null>(null);
  const [timeToPeak, setTimeToPeak] = useState<string | null>(null);

  /* -------- Sleep Data (Previous Night) -------- */
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<string | null>(null);
  const [hadNap, setHadNap] = useState(false);
  const [napDuration, setNapDuration] = useState('');

  /* -------- Hydration (24hrs before) -------- */
  const [fluidIntakeOz, setFluidIntakeOz] = useState('');
  const [wasDehydrated, setWasDehydrated] = useState(false);

  /* -------- Pain characteristics (ICHD-3 criteria) -------- */
  const [severity, setSeverity] = useState(6);
  const [painLocations, setPainLocations] = useState<string[]>([]);
  const [painLaterality, setPainLaterality] = useState<string | null>(null);
  const [painQuality, setPainQuality] = useState<string[]>([]);
  const [worsenedByMovement, setWorsenedByMovement] = useState<boolean | null>(null);

  /* -------- Aura -------- */
  const [auraPresent, setAuraPresent] = useState<boolean | null>(null);
  const [auraTypes, setAuraTypes] = useState<string[]>([]);
  const [auraDuration, setAuraDuration] = useState<string | null>(null);

  /* -------- Associated symptoms (ICHD-3 criteria) -------- */
  const [nausea, setNausea] = useState(false);
  const [vomiting, setVomiting] = useState(false);
  const [photophobia, setPhotophobia] = useState(false);
  const [phonophobia, setPhonophobia] = useState(false);
  const [otherSymptoms, setOtherSymptoms] = useState<string[]>([]);

  /* -------- Phases -------- */
  const [prodromeSymptoms, setProdromeSymptoms] = useState<string[]>([]);
  const [postdromeSymptoms, setPostdromeSymptoms] = useState<string[]>([]);

  /* -------- Triggers -------- */
  const [triggers, setTriggers] = useState<string[]>([]);
  const [foodTriggers, setFoodTriggers] = useState<string[]>([]);
  const [menstrualRelated, setMenstrualRelated] = useState<boolean | null>(null);
  const [weatherRelated, setWeatherRelated] = useState<boolean | null>(null);

  /* -------- Enhanced Medication Tracking -------- */
  const [tookMedication, setTookMedication] = useState<boolean | null>(null);
  const [medications, setMedications] = useState<Array<{
    name: string;
    dose: string;
    type: string;
    timeTaken: Date | null;
    minutesFromOnset: string;
  }>>([]);
  
  // Pain relief tracking at multiple timepoints
  const [reliefAt30min, setReliefAt30min] = useState<string | null>(null);
  const [reliefAt1hr, setReliefAt1hr] = useState<string | null>(null);
  const [reliefAt2hr, setReliefAt2hr] = useState<string | null>(null);
  const [reliefAt4hr, setReliefAt4hr] = useState<string | null>(null);

  /* -------- Disability & Function -------- */
  const [functionalImpact, setFunctionalImpact] = useState<string | null>(null);
  const [couldWork, setCouldWork] = useState<boolean | null>(null);
  const [bedBoundHours, setBedBoundHours] = useState('');

  /* -------- MIDAS (Quarterly Assessment) -------- */
  const [showMidas, setShowMidas] = useState(false);
  const [midasData, setMidasData] = useState<MidasData>({
    missedWorkDays: '',
    reducedProductivityDays: '',
    missedHouseholdDays: '',
    reducedHouseholdDays: '',
    missedSocialDays: '',
  });

  /* -------- Notes -------- */
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  /* -------- Load existing episode if editing -------- */
  useEffect(() => {
    if (episodeId) {
      loadEpisode(episodeId);
    }
  }, [episodeId]);

  const loadEpisode = async (id: string) => {
    setLoading(true);
    try {
      const episodes = await getMigraineReadings();
      const episode = episodes.find(e => e.id === id);
      
      if (episode) {
        setIsQuickLog(false);
        setIsCompleted(episode.is_completed || false);
        
        setStartedAt(new Date(episode.started_at));
        setIsOngoing(episode.is_ongoing);
        if (episode.ended_at) setEndedAt(new Date(episode.ended_at));
        setTimeToPeak(episode.time_to_peak);
        
        // Sleep data
        if (episode.sleep_hours) setSleepHours(episode.sleep_hours);
        setSleepQuality(episode.sleep_quality);
        setHadNap(episode.had_nap || false);
        if (episode.nap_duration) setNapDuration(episode.nap_duration);
        
        // Hydration
        if (episode.fluid_intake_oz) setFluidIntakeOz(episode.fluid_intake_oz);
        setWasDehydrated(episode.was_dehydrated || false);
        
        setSeverity(episode.severity);
        setPainLocations(JSON.parse(episode.pain_locations || '[]'));
        setPainLaterality(episode.pain_laterality);
        setPainQuality(JSON.parse(episode.pain_quality || '[]'));
        setWorsenedByMovement(episode.worsened_by_movement);
        
        setAuraPresent(episode.aura_present);
        if (episode.aura_types) setAuraTypes(JSON.parse(episode.aura_types));
        setAuraDuration(episode.aura_duration);
        
        setNausea(episode.nausea);
        setVomiting(episode.vomiting);
        setPhotophobia(episode.photophobia);
        setPhonophobia(episode.phonophobia);
        setOtherSymptoms(JSON.parse(episode.other_symptoms || '[]'));
        
        setProdromeSymptoms(JSON.parse(episode.prodrome_symptoms || '[]'));
        setPostdromeSymptoms(JSON.parse(episode.postdrome_symptoms || '[]'));
        
        setTriggers(JSON.parse(episode.triggers || '[]'));
        setFoodTriggers(JSON.parse(episode.food_triggers || '[]'));
        setMenstrualRelated(episode.menstrual_related);
        setWeatherRelated(episode.weather_related);
        
        setTookMedication(episode.took_medication);
        if (episode.medications) setMedications(JSON.parse(episode.medications));
        setReliefAt30min(episode.relief_at_30min);
        setReliefAt1hr(episode.relief_at_1hr);
        setReliefAt2hr(episode.relief_at_2hr);
        setReliefAt4hr(episode.relief_at_4hr);
        
        setFunctionalImpact(episode.functional_impact);
        setCouldWork(episode.could_work);
        if (episode.bed_bound_hours) setBedBoundHours(episode.bed_bound_hours);
        
        if (episode.midas_data) setMidasData(JSON.parse(episode.midas_data));
        
        if (episode.note) setNotes(episode.note);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not load episode.');
      // Error
    } finally {
      setLoading(false);
    }
  };

  /* -------- Helpers -------- */
  const toggleMulti = (
    value: string,
    list: string[],
    setter: (v: string[]) => void
  ) => {
    setter(
      list.includes(value)
        ? list.filter(v => v !== value)
        : [...list, value]
    );
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        name: '',
        dose: '',
        type: 'Rescue/Abortive',
        timeTaken: null,
        minutesFromOnset: '',
      },
    ]);
  };

  const updateMedication = (index: number, field: string, value: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  /* -------- Validation & Save -------- */
  const validateQuickLog = () => {
    // Quick log only requires: start time, severity
    return true; // Start time is auto-filled
  };

  const validateFullEntry = () => {
    const missing: string[] = [];
    
    if (painLocations.length === 0) missing.push('pain location');
    if (!painLaterality) missing.push('pain laterality');
    if (painQuality.length === 0) missing.push('pain quality');
    if (worsenedByMovement === null) missing.push('movement impact');
    if (auraPresent === null) missing.push('aura presence');
    if (!nausea && !vomiting && !photophobia && !phonophobia) {
      missing.push('at least one associated symptom (nausea/vomiting/photophobia/phonophobia)');
    }

    if (missing.length > 0) {
      Alert.alert(
        'Missing Required Information',
        `Please provide: ${missing.join(', ')}.\n\nThese are essential for ICHD-3 classification.`
      );
      return false;
    }
    return true;
  };

  const saveQuickLog = async () => {
    if (!validateQuickLog()) return;
    
    setSaving(true);
    try {
      const episodeData = {
        started_at: startedAt.getTime(),
        ended_at: null,
        is_ongoing: true,
        is_completed: false,
        severity,
        note: notes,
        // All other fields will be null/empty
      };

      if (episodeId) {
        await updateMigraineReading(episodeId, episodeData);
      } else {
        await saveMigraineReading(episodeData);
      }

      Alert.alert(
        'Quick Log Saved',
        'Episode started. Complete full details when you feel better.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not save episode.');
      // Error
    } finally {
      setSaving(false);
    }
  };

  const saveFullEntry = async () => {
    if (!validateFullEntry()) return;

    setSaving(true);
    try {
      const previous = await getMigraineReadings();
      
      const classification = classifyMigraine({
        started_at: startedAt.getTime(),
        severity,
        pain_locations: painLocations,
        pain_laterality: painLaterality,
        pain_quality: painQuality,
        worsened_by_movement: worsenedByMovement,
        aura_present: auraPresent,
        nausea,
        vomiting,
        photophobia,
        phonophobia,
      }, previous);

      const midasScore = calculateMidasScore(midasData);
      const midasGrade = getMidasGrade(midasScore);

      const episodeData = {
        started_at: startedAt.getTime(),
        ended_at: isOngoing ? null : endedAt?.getTime(),
        is_ongoing: isOngoing,
        is_completed: true,
        time_to_peak: timeToPeak,
        
        // Sleep data
        sleep_hours: sleepHours,
        sleep_quality: sleepQuality,
        had_nap: hadNap,
        nap_duration: hadNap ? napDuration : null,
        
        // Hydration
        fluid_intake_oz: fluidIntakeOz,
        was_dehydrated: wasDehydrated,
        
        // Pain characteristics
        severity,
        pain_locations: JSON.stringify(painLocations),
        pain_laterality: painLaterality,
        pain_quality: JSON.stringify(painQuality),
        worsened_by_movement: worsenedByMovement,
        
        // Aura
        aura_present: auraPresent,
        aura_types: auraPresent ? JSON.stringify(auraTypes) : null,
        aura_duration: auraPresent ? auraDuration : null,
        
        // Associated symptoms
        nausea,
        vomiting,
        photophobia,
        phonophobia,
        other_symptoms: JSON.stringify(otherSymptoms),
        
        // Phases
        prodrome_symptoms: JSON.stringify(prodromeSymptoms),
        postdrome_symptoms: JSON.stringify(postdromeSymptoms),
        
        // Triggers
        triggers: JSON.stringify(triggers),
        food_triggers: JSON.stringify(foodTriggers),
        menstrual_related: menstrualRelated,
        weather_related: weatherRelated,
        
        // Medication
        took_medication: tookMedication,
        medications: JSON.stringify(medications),
        relief_at_30min: reliefAt30min,
        relief_at_1hr: reliefAt1hr,
        relief_at_2hr: reliefAt2hr,
        relief_at_4hr: reliefAt4hr,
        
        // Disability
        functional_impact: functionalImpact,
        could_work: couldWork,
        bed_bound_hours: bedBoundHours,
        
        // MIDAS
        midas_data: JSON.stringify(midasData),
        midas_score: midasScore,
        midas_grade: midasGrade,
        
        // Classification
        migraine_classification: classification.classification,
        migraine_type: classification.type,
        meets_ichd3_criteria: classification.meets_ichd3,
        ichd3_criteria_count: classification.ichd3_criteria_met,
        headache_days_30: classification.headache_days_30,
        migraine_days_30: classification.migraine_days_30,
        
        note: notes,
      };

      if (episodeId) {
        await updateMigraineReading(episodeId, episodeData);
        Alert.alert('Success', 'Episode updated successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await saveMigraineReading(episodeData);
        Alert.alert('Success', 'Episode saved successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save episode.');
      // Error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ======================================================
     RENDER FUNCTIONS
  ====================================================== */

  const renderQuickLogMode = () => (
    <>
      <SectionCard title="Quick Log - Migraine Started" required>
        <Text style={styles.helperText}>
          Log the essentials now. Complete full details later when you feel better.
        </Text>
        
        <Text style={styles.label}>Start Time</Text>
        <DateTimePicker
          value={startedAt}
          onChange={setStartedAt}
          mode="datetime"
        />
        
        <Text style={[styles.label, { marginTop: spacing.md }]}>
          Pain Severity (0-10)
        </Text>
        <Text style={styles.value}>{severity} - {SEVERITY_LABELS[severity]}</Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={severity}
          onValueChange={setSeverity}
          minimumTrackTintColor={tokens.colors.primary}
          maximumTrackTintColor={tokens.colors.border}
        />
        
        <Text style={[styles.label, { marginTop: spacing.md }]}>Quick Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything important to remember..."
          placeholderTextColor={tokens.colors.textMuted}
          multiline
          numberOfLines={3}
        />
      </SectionCard>

      <View style={styles.stickyFooter}>
        <BigButton
          title={saving ? 'Saving...' : 'Save Quick Log'}
          onPress={saveQuickLog}
          disabled={saving}
          variant="primary"
        />
        <TouchableOpacity
          style={styles.completeLaterButton}
          onPress={() => setIsQuickLog(false)}
        >
          <Text style={styles.completeLaterText}>
            Actually, I'll fill it out completely now
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderFullEntry = () => (
    <>
      {/* Header with mode toggle */}
      {!isEditing && !isCompleted && (
        <View style={[styles.card, shadows.low]}>
          <TouchableOpacity
            style={styles.modeToggle}
            onPress={() => setIsQuickLog(true)}
          >
            <Text style={styles.modeToggleText}>
              Switch to Quick Log Mode →
            </Text>
            <Text style={styles.modeToggleSubtext}>
              Save minimal info now, complete later
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Timing Section */}
      <SectionCard title="Timing" required>
        <Text style={styles.label}>Started At</Text>
        <DateTimePicker
          value={startedAt}
          onChange={setStartedAt}
          mode="datetime"
        />

        {/* Timestamp validation */}
        {Math.abs(Date.now() - startedAt.getTime()) > 2 * 60 * 60 * 1000 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ This entry is {Math.round((Date.now() - startedAt.getTime()) / (60 * 60 * 1000))} hours old.
              Is the date/time correct?
            </Text>
          </View>
        )}

        <View style={{ marginTop: spacing.md }}>
          <ToggleRow
            label="Episode is ongoing"
            value={isOngoing}
            onChange={setIsOngoing}
          />
        </View>

        {!isOngoing && (
          <>
            <Text style={[styles.label, { marginTop: spacing.md }]}>Ended At</Text>
            <DateTimePicker
              value={endedAt || new Date()}
              onChange={setEndedAt}
              mode="datetime"
            />
            {endedAt && (
              <Text style={styles.helperText}>
                Duration: {Math.round((endedAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60))} hours
              </Text>
            )}
          </>
        )}

        <Text style={[styles.label, { marginTop: spacing.md }]}>Time to Peak Pain</Text>
        <Text style={styles.helperText}>How long until pain reached maximum?</Text>
        <ChipRow
          values={TIME_TO_PEAK_OPTIONS}
          selected={timeToPeak}
          onSelect={setTimeToPeak}
        />
      </SectionCard>

      {/* Sleep Data Section */}
      <SectionCard title="Sleep (Previous Night)">
        <Text style={styles.helperText}>
          Sleep disturbance is a major migraine trigger
        </Text>
        
        <Text style={styles.label}>Hours of Sleep</Text>
        <TextInput
          style={styles.input}
          value={sleepHours}
          onChangeText={setSleepHours}
          placeholder="e.g., 7.5"
          placeholderTextColor={tokens.colors.textMuted}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>Sleep Quality</Text>
        <ChipRow
          values={SLEEP_QUALITY}
          selected={sleepQuality}
          onSelect={setSleepQuality}
        />

        <View style={{ marginTop: spacing.md }}>
          <ToggleRow
            label="Took a nap during day"
            value={hadNap}
            onChange={setHadNap}
          />
        </View>

        {hadNap && (
          <>
            <Text style={[styles.label, { marginTop: spacing.md }]}>Nap Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={napDuration}
              onChangeText={setNapDuration}
              placeholder="e.g., 30"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="number-pad"
            />
          </>
        )}
      </SectionCard>

      {/* Hydration Section */}
      <SectionCard title="Hydration (24hrs Before)">
        <Text style={styles.label}>Fluid Intake (oz)</Text>
        <Text style={styles.helperText}>
          Recommended: 64-80 oz/day. Dehydration is a common trigger.
        </Text>
        <TextInput
          style={styles.input}
          value={fluidIntakeOz}
          onChangeText={setFluidIntakeOz}
          placeholder="e.g., 48"
          placeholderTextColor={tokens.colors.textMuted}
          keyboardType="number-pad"
        />

        <View style={{ marginTop: spacing.md }}>
          <ToggleRow
            label="Felt dehydrated"
            value={wasDehydrated}
            onChange={setWasDehydrated}
          />
        </View>
      </SectionCard>

      {/* Pain Characteristics Section */}
      <SectionCard title="Pain Characteristics" required>
        <Text style={styles.label}>Pain Severity (0-10) *</Text>
        <Text style={styles.value}>{severity} - {SEVERITY_LABELS[severity]}</Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={severity}
          onValueChange={setSeverity}
          minimumTrackTintColor={tokens.colors.primary}
          maximumTrackTintColor={tokens.colors.border}
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>
          Specific Pain Location(s) *
        </Text>
        <Text style={styles.helperText}>Select all that apply</Text>
        <MultiChipRow
          values={PAIN_LOCATION_SPECIFIC}
          selected={painLocations}
          onToggle={(v) => toggleMulti(v, painLocations, setPainLocations)}
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>Pain Laterality *</Text>
        <ChipRow
          values={PAIN_LATERALITY}
          selected={painLaterality}
          onSelect={setPainLaterality}
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>Pain Quality *</Text>
        <MultiChipRow
          values={PAIN_QUALITY}
          selected={painQuality}
          onToggle={(v) => toggleMulti(v, painQuality, setPainQuality)}
        />

        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.label}>Worsened by Movement/Activity? *</Text>
          <View style={styles.yesNoButtons}>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                worsenedByMovement === true && styles.yesNoButtonActive,
              ]}
              onPress={() => setWorsenedByMovement(true)}
            >
              <Text
                style={[
                  styles.yesNoButtonText,
                  worsenedByMovement === true && styles.yesNoButtonTextActive,
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                worsenedByMovement === false && styles.yesNoButtonActive,
              ]}
              onPress={() => setWorsenedByMovement(false)}
            >
              <Text
                style={[
                  styles.yesNoButtonText,
                  worsenedByMovement === false && styles.yesNoButtonTextActive,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SectionCard>

      {/* Aura Section */}
      <SectionCard title="Aura" required>
        <Text style={styles.label}>Did you experience an aura? *</Text>
        <Text style={styles.helperText}>
          Visual disturbances, numbness, speech difficulty before headache
        </Text>
        <View style={styles.yesNoButtons}>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              auraPresent === true && styles.yesNoButtonActive,
            ]}
            onPress={() => setAuraPresent(true)}
          >
            <Text
              style={[
                styles.yesNoButtonText,
                auraPresent === true && styles.yesNoButtonTextActive,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              auraPresent === false && styles.yesNoButtonActive,
            ]}
            onPress={() => setAuraPresent(false)}
          >
            <Text
              style={[
                styles.yesNoButtonText,
                auraPresent === false && styles.yesNoButtonTextActive,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>

        {auraPresent && (
          <>
            <Text style={[styles.label, { marginTop: spacing.md }]}>Aura Type(s)</Text>
            <MultiChipRow
              values={AURA_TYPES}
              selected={auraTypes}
              onToggle={(v) => toggleMulti(v, auraTypes, setAuraTypes)}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Aura Duration</Text>
            <Text style={styles.helperText}>
              ICHD-3 criteria: 5-60 minutes. {'>'} 60 min may suggest different diagnosis.
            </Text>
            <ChipRow
              values={AURA_DURATION_OPTIONS}
              selected={auraDuration}
              onSelect={setAuraDuration}
            />
            {auraDuration === '>60 minutes (atypical)' && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Aura lasting {'>'} 60 minutes is atypical. Discuss with your neurologist.
                </Text>
              </View>
            )}
          </>
        )}
      </SectionCard>

      {/* Associated Symptoms Section */}
      <SectionCard title="Associated Symptoms" required>
        <Text style={styles.helperText}>
          Select all that apply (at least one required for ICHD-3)
        </Text>
        
        <View style={styles.symptomGrid}>
          <SymptomToggle label="Nausea" value={nausea} onChange={setNausea} />
          <SymptomToggle label="Vomiting" value={vomiting} onChange={setVomiting} />
          <SymptomToggle
            label="Light sensitivity (photophobia)"
            value={photophobia}
            onChange={setPhotophobia}
          />
          <SymptomToggle
            label="Sound sensitivity (phonophobia)"
            value={phonophobia}
            onChange={setPhonophobia}
          />
        </View>

        <Text style={[styles.label, { marginTop: spacing.md }]}>Other Symptoms</Text>
        <MultiChipRow
          values={ASSOCIATED_SYMPTOMS}
          selected={otherSymptoms}
          onToggle={(v) => toggleMulti(v, otherSymptoms, setOtherSymptoms)}
        />
      </SectionCard>

      {/* Prodrome & Postdrome */}
      <SectionCard title="Prodrome Symptoms (Before Headache)">
        <Text style={styles.helperText}>
          Warning signs in 24-48 hours before attack
        </Text>
        <MultiChipRow
          values={PRODROME_SYMPTOMS}
          selected={prodromeSymptoms}
          onToggle={(v) => toggleMulti(v, prodromeSymptoms, setProdromeSymptoms)}
        />
      </SectionCard>

      {!isOngoing && (
        <SectionCard title="Postdrome Symptoms (After Headache)">
          <Text style={styles.helperText}>
            Symptoms after pain resolved ("migraine hangover")
          </Text>
          <MultiChipRow
            values={POSTDROME_SYMPTOMS}
            selected={postdromeSymptoms}
            onToggle={(v) => toggleMulti(v, postdromeSymptoms, setPostdromeSymptoms)}
          />
        </SectionCard>
      )}

      {/* Triggers Section */}
      <SectionCard title="Possible Triggers">
        <Text style={styles.helperText}>
          What happened in 24-48 hours before attack?
        </Text>
        
        <Text style={styles.label}>General Triggers</Text>
        <MultiChipRow
          values={TRIGGERS}
          selected={triggers}
          onToggle={(v) => toggleMulti(v, triggers, setTriggers)}
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>Food/Beverage Triggers</Text>
        <MultiChipRow
          values={FOOD_TRIGGERS}
          selected={foodTriggers}
          onToggle={(v) => toggleMulti(v, foodTriggers, setFoodTriggers)}
        />

        <View style={{ marginTop: spacing.md }}>
          <ToggleRow
            label="Weather/barometric pressure change"
            value={weatherRelated || false}
            onChange={setWeatherRelated}
          />
        </View>
      </SectionCard>

      {/* Enhanced Medication Tracking */}
      <SectionCard title="Medication & Treatment">
        <Text style={styles.label}>Did you take medication? *</Text>
        <View style={styles.yesNoButtons}>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              tookMedication === true && styles.yesNoButtonActive,
            ]}
            onPress={() => setTookMedication(true)}
          >
            <Text
              style={[
                styles.yesNoButtonText,
                tookMedication === true && styles.yesNoButtonTextActive,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              tookMedication === false && styles.yesNoButtonActive,
            ]}
            onPress={() => setTookMedication(false)}
          >
            <Text
              style={[
                styles.yesNoButtonText,
                tookMedication === false && styles.yesNoButtonTextActive,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>

        {tookMedication && (
          <>
            <Text style={styles.helperText}>
              Track all medications taken (rescue and preventive)
            </Text>
            
            {medications.map((med, index) => (
              <View key={index} style={styles.medicationCard}>
                <View style={styles.medicationHeader}>
                  <Text style={styles.medicationTitle}>Medication {index + 1}</Text>
                  {medications.length > 1 && (
                    <TouchableOpacity onPress={() => removeMedication(index)}>
                      <Text style={styles.removeButton}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.label}>Medication Name</Text>
                <TextInput
                  style={styles.input}
                  value={med.name}
                  onChangeText={(v) => updateMedication(index, 'name', v)}
                  placeholder="e.g., Sumatriptan, Ibuprofen"
                  placeholderTextColor={tokens.colors.textMuted}
                />

                <Text style={[styles.label, { marginTop: spacing.sm }]}>Dose</Text>
                <TextInput
                  style={styles.input}
                  value={med.dose}
                  onChangeText={(v) => updateMedication(index, 'dose', v)}
                  placeholder="e.g., 100mg, 2 tablets"
                  placeholderTextColor={tokens.colors.textMuted}
                />

                <Text style={[styles.label, { marginTop: spacing.sm }]}>Type</Text>
                <ChipRow
                  values={MEDICATION_TYPE}
                  selected={med.type}
                  onSelect={(v) => updateMedication(index, 'type', v)}
                />

                <Text style={[styles.label, { marginTop: spacing.sm }]}>
                  Minutes from Onset to Medication
                </Text>
                <Text style={styles.helperText}>
                  The "golden hour" - rescue meds work best within 60-120 min
                </Text>
                <TextInput
                  style={styles.input}
                  value={med.minutesFromOnset}
                  onChangeText={(v) => updateMedication(index, 'minutesFromOnset', v)}
                  placeholder="e.g., 45"
                  placeholderTextColor={tokens.colors.textMuted}
                  keyboardType="number-pad"
                />
                {parseInt(med.minutesFromOnset) > 120 && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      ⚠️ Medication taken {'>'} 2 hours after onset may be less effective
                    </Text>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addMedicationButton} onPress={addMedication}>
              <Text style={styles.addMedicationText}>+ Add Another Medication</Text>
            </TouchableOpacity>

            {/* Pain Relief Tracking */}
            <Text style={[styles.label, { marginTop: spacing.md }]}>
              Pain Relief Tracking
            </Text>
            <Text style={styles.helperText}>
              Track pain reduction at multiple timepoints (if available)
            </Text>

            <Text style={[styles.label, { marginTop: spacing.sm }]}>Relief at 30 minutes</Text>
            <ChipRow
              values={PAIN_RELIEF_LEVELS}
              selected={reliefAt30min}
              onSelect={setReliefAt30min}
            />

            <Text style={[styles.label, { marginTop: spacing.sm }]}>Relief at 1 hour</Text>
            <ChipRow
              values={PAIN_RELIEF_LEVELS}
              selected={reliefAt1hr}
              onSelect={setReliefAt1hr}
            />

            <Text style={[styles.label, { marginTop: spacing.sm }]}>Relief at 2 hours</Text>
            <ChipRow
              values={PAIN_RELIEF_LEVELS}
              selected={reliefAt2hr}
              onSelect={setReliefAt2hr}
            />

            <Text style={[styles.label, { marginTop: spacing.sm }]}>Relief at 4 hours</Text>
            <ChipRow
              values={PAIN_RELIEF_LEVELS}
              selected={reliefAt4hr}
              onSelect={setReliefAt4hr}
            />
          </>
        )}

        {tookMedication === false && (
          <View style={styles.naturalBadge}>
            <Text style={styles.naturalText}>✓ Natural resolution tracked</Text>
          </View>
        )}
      </SectionCard>

      {/* Functional Impact/Disability */}
      <SectionCard title="Functional Impact">
        <Text style={styles.label}>Overall Disability Level</Text>
        <ChipRow
          values={DISABILITY_FUNCTIONAL}
          selected={functionalImpact}
          onSelect={setFunctionalImpact}
        />

        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.label}>Could you work/study?</Text>
          <View style={styles.yesNoButtons}>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                couldWork === true && styles.yesNoButtonActive,
              ]}
              onPress={() => setCouldWork(true)}
            >
              <Text
                style={[
                  styles.yesNoButtonText,
                  couldWork === true && styles.yesNoButtonTextActive,
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                couldWork === false && styles.yesNoButtonActive,
              ]}
              onPress={() => setCouldWork(false)}
            >
              <Text
                style={[
                  styles.yesNoButtonText,
                  couldWork === false && styles.yesNoButtonTextActive,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.label, { marginTop: spacing.md }]}>Hours Bed-Bound</Text>
        <TextInput
          style={styles.input}
          value={bedBoundHours}
          onChangeText={setBedBoundHours}
          placeholder="e.g., 4"
          placeholderTextColor={tokens.colors.textMuted}
          keyboardType="decimal-pad"
        />
      </SectionCard>

      {/* MIDAS Questionnaire */}
      <SectionCard title="MIDAS Disability Assessment (Optional)">
        <Text style={styles.helperText}>
          Complete every 3 months for insurance/treatment qualification
        </Text>
        
        <TouchableOpacity
          style={styles.midasToggle}
          onPress={() => setShowMidas(!showMidas)}
        >
          <Text style={styles.midasToggleText}>
            {showMidas ? '▼ Hide MIDAS Questionnaire' : '▶ Complete MIDAS Questionnaire'}
          </Text>
        </TouchableOpacity>

        {showMidas && (
          <>
            <Text style={styles.midasInstructions}>
              In the last 3 months, how many days:
            </Text>

            <Text style={[styles.label, { marginTop: spacing.md }]}>
              1. Did you miss work/school?
            </Text>
            <TextInput
              style={styles.input}
              value={midasData.missedWorkDays}
              onChangeText={(v) => setMidasData({ ...midasData, missedWorkDays: v })}
              placeholder="Number of days"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { marginTop: spacing.sm }]}>
              2. Was your productivity at work/school reduced by half or more?
            </Text>
            <TextInput
              style={styles.input}
              value={midasData.reducedProductivityDays}
              onChangeText={(v) => setMidasData({ ...midasData, reducedProductivityDays: v })}
              placeholder="Number of days"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { marginTop: spacing.sm }]}>
              3. Did you not do household work?
            </Text>
            <TextInput
              style={styles.input}
              value={midasData.missedHouseholdDays}
              onChangeText={(v) => setMidasData({ ...midasData, missedHouseholdDays: v })}
              placeholder="Number of days"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { marginTop: spacing.sm }]}>
              4. Was household work productivity reduced by half or more?
            </Text>
            <TextInput
              style={styles.input}
              value={midasData.reducedHouseholdDays}
              onChangeText={(v) => setMidasData({ ...midasData, reducedHouseholdDays: v })}
              placeholder="Number of days"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { marginTop: spacing.sm }]}>
              5. Did you miss family/social/leisure activities?
            </Text>
            <TextInput
              style={styles.input}
              value={midasData.missedSocialDays}
              onChangeText={(v) => setMidasData({ ...midasData, missedSocialDays: v })}
              placeholder="Number of days"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="number-pad"
            />

            {Object.values(midasData).some(v => v !== '') && (
              <View style={styles.midasScore}>
                <Text style={styles.midasScoreLabel}>MIDAS Score:</Text>
                <Text style={styles.midasScoreValue}>
                  {calculateMidasScore(midasData)}
                </Text>
                <Text style={styles.midasGrade}>
                  {getMidasGrade(calculateMidasScore(midasData))}
                </Text>
              </View>
            )}
          </>
        )}
      </SectionCard>

      {/* Notes */}
      <SectionCard title="Additional Notes">
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any other important details..."
          placeholderTextColor={tokens.colors.textMuted}
          multiline
          numberOfLines={4}
        />
      </SectionCard>

      {/* Save Button */}
      <View style={styles.stickyFooter}>
        <BigButton
          title={saving ? 'Saving...' : isEditing ? 'Update Episode' : 'Save Episode'}
          onPress={saveFullEntry}
          disabled={saving}
          variant="primary"
        />
      </View>
    </>
  );

  /* ======================================================
     MAIN RENDER
  ====================================================== */

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditing ? 'Edit Episode' : 'Log Migraine'}
            </Text>
            <Text style={styles.subtitle}>Medical-Grade Tracking</Text>
          </View>

          {isQuickLog && !isEditing ? renderQuickLogMode() : renderFullEntry()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ======================================================
   UI COMPONENTS
====================================================== */

function SectionCard({
  title,
  required = false,
  children,
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, shadows.low]}>
      <Text style={styles.sectionTitle}>
        {title}
        {required && <Text style={styles.requiredMarker}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      style={styles.toggleRow}
    >
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: tokens.colors.border, true: tokens.colors.primary }}
        thumbColor="#fff"
      />
    </TouchableOpacity>
  );
}

function SymptomToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      style={[
        styles.symptomToggle,
        value && styles.symptomToggleActive,
      ]}
    >
      <Text
        style={[
          styles.symptomToggleText,
          value && styles.symptomToggleTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ChipRow({
  values,
  selected,
  onSelect,
}: {
  values: string[];
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.row}>
      {values.map(v => (
        <Chip
          key={v}
          value={v}
          selected={selected === v}
          onPress={() => onSelect(v)}
        />
      ))}
    </View>
  );
}

function MultiChipRow({
  values,
  selected,
  onToggle,
}: {
  values: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View style={styles.row}>
      {values.map(v => (
        <Chip
          key={v}
          value={v}
          selected={selected.includes(v)}
          onPress={() => onToggle(v)}
        />
      ))}
    </View>
  );
}

function Chip({
  value,
  selected,
  onPress,
}: {
  value: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
        ]}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );
}

/* ======================================================
   STYLES
====================================================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.background },
  keyboardView: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 200 },

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
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.textMuted,
  },

  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    color: tokens.colors.text,
    marginBottom: spacing.xs,
  },
  requiredMarker: {
    color: tokens.colors.danger,
  },

  label: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: tokens.colors.text,
    marginTop: spacing.xs,
  },
  value: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    color: tokens.colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xxs,
  },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },

  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.background,
  },
  chipSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: tokens.colors.text,
  },
  chipTextSelected: { color: '#fff' },

  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  symptomToggle: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
  },
  symptomToggleActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primary + '15',
  },
  symptomToggleText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: tokens.colors.text,
    textAlign: 'center',
  },
  symptomToggleTextActive: {
    color: tokens.colors.primary,
  },

  input: {
    backgroundColor: tokens.colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.text,
    marginTop: spacing.xs,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  yesNoButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
  },
  yesNoButtonActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primary + '15',
  },
  yesNoButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: tokens.colors.text,
  },
  yesNoButtonTextActive: {
    color: tokens.colors.primary,
  },

  warningBox: {
    backgroundColor: tokens.colors.warning + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  warningText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: tokens.colors.warning,
  },

  medicationCard: {
    backgroundColor: tokens.colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginTop: spacing.sm,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  medicationTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    color: tokens.colors.text,
  },
  removeButton: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: tokens.colors.danger,
  },

  addMedicationButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: tokens.colors.primary,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addMedicationText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: tokens.colors.primary,
  },

  naturalBadge: {
    backgroundColor: tokens.colors.success + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  naturalText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: tokens.colors.success,
    textAlign: 'center',
  },

  midasToggle: {
    padding: spacing.sm,
    backgroundColor: tokens.colors.primary + '10',
    borderRadius: borderRadius.md,
  },
  midasToggleText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  midasInstructions: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  midasScore: {
    backgroundColor: tokens.colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  midasScoreLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: tokens.colors.text,
  },
  midasScoreValue: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    color: tokens.colors.primary,
    marginVertical: spacing.xs,
  },
  midasGrade: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: tokens.colors.text,
  },

  modeToggle: {
    padding: spacing.sm,
  },
  modeToggleText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  modeToggleSubtext: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.textMuted,
    marginTop: spacing.xxs,
  },

  completeLaterButton: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  completeLaterText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: tokens.colors.textMuted,
    textDecorationLine: 'underline',
  },

  stickyFooter: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    zIndex: 1000,
    backgroundColor: tokens.colors.background,
    paddingTop: spacing.sm,
  },
});