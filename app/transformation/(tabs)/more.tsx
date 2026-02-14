import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { SectionHeader } from '@/components/design/SectionHeader';
import { Card } from '@/components/design/Card';
import TransformationListItem from '@/components/transformation/TransformationListItem';
import { useTransformationLayout } from '@/hooks/use-transformation-layout';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing } from '@/constants/theme';

const LINKS = [
  {
    id: 'checkins',
    title: 'Weekly Check-ins',
    subtitle: 'Weigh-in, measurements, notes',
    icon: 'scale' as const,
    route: '/transformation/checkins',
  },
  {
    id: 'workouts',
    title: 'Workouts',
    subtitle: 'Log sessions, track progress',
    icon: 'dumbbell' as const,
    route: '/transformation/workouts',
  },
  {
    id: 'hair-skin',
    title: 'Hair & Skin',
    subtitle: 'Routine adherence, hairline checks',
    icon: 'spa' as const,
    route: '/transformation/hair-skin',
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const { scrollContentStyle } = useTransformationLayout();

  const renderIcon = (icon: 'scale' | 'dumbbell' | 'spa') => {
    if (icon === 'scale') {
      return <MaterialCommunityIcons name="scale-bathroom" size={24} color={tokens.colors.primary} />;
    }
    if (icon === 'dumbbell') {
      return <FontAwesome5 name="dumbbell" size={22} color={tokens.colors.primary} />;
    }
    return <MaterialCommunityIcons name="face-woman-shimmer" size={24} color={tokens.colors.primary} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, scrollContentStyle]}>
        <SectionHeader title="More" style={styles.screenSectionHeader} />
        <Card style={styles.listCard}>
          {LINKS.map((link, index) => (
            <TransformationListItem
              key={link.id}
              title={link.title}
              subtitle={link.subtitle}
              icon={renderIcon(link.icon)}
              onPress={() => router.push(link.route as any)}
              isLast={index === LINKS.length - 1}
            />
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {},
  screenSectionHeader: { marginBottom: spacing.lg },
  listCard: { paddingHorizontal: spacing.md, paddingVertical: 0, paddingTop: 0, paddingBottom: 0 },
});
