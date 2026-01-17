import BigButton from '@/components/BigButton';
import DateTimePicker from '@/components/DateTimePicker';
import { borderRadius, shadows, spacing, tokens } from '@/constants/theme';
import {
  getMigraineReadings,
  saveMigraineReading,
} from '@/services/db';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/* ======================================================
   CONSTANTS (Clinically aligned)
====================================================== */

const ONSET_SPEED = [
  'Sudden (<10 min)',
  'Gradual (10–60 min)',
  'Slow (>1 hr)',
];

const TIME_TO_PEAK = ['<30 min', '30–60 min', '>60 min'];

const FUNCTIONAL_IMPACT = [
  'No impact',
  'Reduced activity',
  'Missed work/school',
  'Bed rest required',
];

const ABORTIVE_TIMING = [
  'Early (≤3/10)',
  'Moderate (4–6/10)',
  'Late (≥7/10)',
];

const RELIEF = [
  'No relief',
  'Partial relief',
  'Complete relief',
  'Pain recurred',
];

const SENSORY_AVOIDANCE = [
  'Dark room',
  'Avoided noise',
  'Avoided screens',
];

const SLEEP_RELATION = [
  'Triggered by poor sleep',
  'Woke from sleep',
  'Improved after sleep',
];

/* ======================================================
   MIGRAINE CLASSIFICATION (ICHD-3 aligned)
====================================================== */

function classifyMigraine(entries: any[]) {
  const now = Date.now();
  const last30Days = entries.filter(
    e => e.started_at >= now - 30 * 24 * 60 * 60 * 1000
  );

  const headacheDays = new Set(
    last30Days.map(e =>
      new Date(e.started_at).toDateString()
    )
  ).size;

  const migraineDays = last30Days.filter(
    e => e.severity >= 5 || e.aura_present
  ).length;

  return {
    classification:
      headacheDays >= 15 && migraineDays >= 8
        ? 'chronic'
        : 'episodic',
    headache_days_30: headacheDays,
    migraine_days_30: migraineDays,
  };
}

/* ======================================================
   MAIN SCREEN
====================================================== */

export default function AddMigraineScreen() {
  const router = useRouter();

  /* -------- Core timing -------- */
  const [startedAt, setStartedAt] = useState(new Date());
  const [isOngoing, setIsOngoing] = useState(true);
  const [endedAt, setEndedAt] = useState<Date | null>(null);

  /* -------- Core phenotype -------- */
  const [severity, setSeverity] = useState(6);
  const [onsetSpeed, setOnsetSpeed] = useState<string | null>(null);
  const [timeToPeak, setTimeToPeak] = useState<string | null>(null);

  /* -------- Treatment -------- */
  const [abortiveTiming, setAbortiveTiming] = useState<string | null>(null);
  const [relief, setRelief] = useState<string | null>(null);

  /* -------- Impact -------- */
  const [functionalImpact, setFunctionalImpact] = useState<string[]>([]);
  const [sensoryAvoidance, setSensoryAvoidance] = useState<string[]>([]);
  const [sleepRelation, setSleepRelation] = useState<string[]>([]);

  /* -------- Optional -------- */
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const [saving, setSaving] = useState(false);

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

  /* -------- Save -------- */
  const handleSave = async () => {
    if (!onsetSpeed || !timeToPeak) {
      Alert.alert(
        'Missing info',
        'Please capture onset speed and time to peak.'
      );
      return;
    }

    setSaving(true);
    try {
      const previous = await getMigraineReadings();
      const classification = classifyMigraine(previous);

      await saveMigraineReading({
        started_at: startedAt.getTime(),
        ended_at: isOngoing ? null : endedAt?.getTime(),
        is_ongoing: isOngoing,
        severity,
        onset_speed: onsetSpeed,
        time_to_peak: timeToPeak,
        abortive_timing: abortiveTiming,
        relief,
        functional_disability: JSON.stringify(functionalImpact),
        sensory_avoidance: JSON.stringify(sensoryAvoidance),
        sleep_relation: JSON.stringify(sleepRelation),
        note: notes || undefined,
        migraine_classification: classification.classification,
        headache_days_30: classification.headache_days_30,
        migraine_days_30: classification.migraine_days_30,
      });

      Alert.alert(
        'Saved',
        `Migraine logged (${classification.classification}).`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not save migraine.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  /* ======================================================
     RENDER
  ===================================================== */

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.stickyFooter}>
          <BigButton
            title={saving ? 'Saving…' : 'Save'}
            onPress={handleSave}
            disabled={saving}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Text style={styles.title}>Migraine Episode</Text>
          <Text style={styles.subtitle}>
            Clinically detailed migraine tracking
          </Text>
        </View>

        {/* TIMING */}
        <Card>
          <DateTimePicker
            label="Started at"
            value={startedAt}
            onChange={setStartedAt}
            mode="datetime"
          />

          <ToggleRow
            label="Still ongoing"
            value={isOngoing}
            onChange={setIsOngoing}
          />

          {!isOngoing && (
            <DateTimePicker
              label="Ended at"
              value={endedAt ?? new Date()}
              onChange={setEndedAt}
              mode="datetime"
            />
          )}
        </Card>

        {/* SEVERITY */}
        <Card>
          <Text style={styles.label}>Pain severity</Text>
          <Slider
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={severity}
            onValueChange={setSeverity}
            minimumTrackTintColor={tokens.colors.danger}
            maximumTrackTintColor={tokens.colors.border}
          />
          <Text style={styles.value}>{severity}/10</Text>
        </Card>

        {/* ONSET */}
        <Card>
          <Text style={styles.label}>Onset speed</Text>
          <ChipRow
            values={ONSET_SPEED}
            selected={onsetSpeed}
            onSelect={setOnsetSpeed}
          />

          <Text style={styles.label}>Time to peak pain</Text>
          <ChipRow
            values={TIME_TO_PEAK}
            selected={timeToPeak}
            onSelect={setTimeToPeak}
          />
        </Card>

        {/* TREATMENT */}
        <Card>
          <Text style={styles.label}>Medication timing</Text>
          <ChipRow
            values={ABORTIVE_TIMING}
            selected={abortiveTiming}
            onSelect={setAbortiveTiming}
          />

          <Text style={styles.label}>Relief</Text>
          <ChipRow
            values={RELIEF}
            selected={relief}
            onSelect={setRelief}
          />
        </Card>

        {/* DETAILS */}
        <Card>
          <TouchableOpacity
            onPress={() => setShowDetails(v => !v)}
          >
            <Text style={styles.sectionTitle}>
              Impact & clinical details {showDetails ? '▾' : '▸'}
            </Text>
          </TouchableOpacity>

          {showDetails && (
            <>
              <Text style={styles.label}>Functional impact</Text>
              <MultiChipRow
                values={FUNCTIONAL_IMPACT}
                selected={functionalImpact}
                onToggle={v =>
                  toggleMulti(v, functionalImpact, setFunctionalImpact)
                }
              />

              <Text style={styles.label}>Sensory avoidance</Text>
              <MultiChipRow
                values={SENSORY_AVOIDANCE}
                selected={sensoryAvoidance}
                onToggle={v =>
                  toggleMulti(v, sensoryAvoidance, setSensoryAvoidance)
                }
              />

              <Text style={styles.label}>Sleep relation</Text>
              <MultiChipRow
                values={SLEEP_RELATION}
                selected={sleepRelation}
                onToggle={v =>
                  toggleMulti(v, sleepRelation, setSleepRelation)
                }
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </>
          )}
        </Card>

        <View style={{ height: 120 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ======================================================
   REUSABLE UI COMPONENTS
====================================================== */

function Card({ children }: { children: React.ReactNode }) {
  return <View style={[styles.card, shadows.low]}>{children}</View>;
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
      <Text style={styles.toggle}>
        {value ? 'Yes' : 'No'}
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
      style={[
        styles.chip,
        selected && styles.chipSelected,
      ]}
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
  content: { padding: spacing.lg, paddingBottom: 160 },
  
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

  label: { 
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600', 
    color: tokens.colors.text 
  },
  value: { 
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.textMuted 
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    color: tokens.colors.text,
  },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },

  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  chipSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  chipText: { 
    fontSize: 13, 
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600', 
    color: tokens.colors.text 
  },
  chipTextSelected: { color: '#fff' },

  input: {
    backgroundColor: tokens.colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: tokens.colors.text,
  },
  textArea: { minHeight: 80 },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    color: tokens.colors.primary,
  },

  stickyFooter: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
