import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getTransformationProfile } from '@/services/db';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getThemeTokens } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

export default function TransformationIndex() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  useEffect(() => {
    getTransformationProfile().then((profile) => {
      if (!profile) {
        router.replace('/transformation/onboarding');
        return;
      }
      if (profile.onboarding_complete) {
        router.replace('/transformation/today');
      } else {
        router.replace('/transformation/onboarding');
      }
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <ActivityIndicator size="large" color={tokens.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
