import { Stack } from 'expo-router';

export default function TransformationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ title: 'Transformation Setup' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="checkins" options={{ title: 'Weekly Check-ins' }} />
      <Stack.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Stack.Screen name="hair-skin" options={{ title: 'Hair & Skin' }} />
    </Stack>
  );
}
