import { initDb } from '@/services/db';
import { rescheduleAllReminders } from '@/services/reminders';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { darkTheme, lightTheme, getThemeTokens } from '@/constants/theme';
import { ThemePreferenceProvider, useThemePreference } from '@/hooks/use-theme-preference';
import { useFonts } from '@/hooks/use-fonts';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutInner() {
  const { colorScheme } = useThemePreference();
  const { fontsLoaded, fontError } = useFonts();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize database
        initDb();
        
        // Check and reschedule reminders if needed (don't force - only reschedule if missing)
        // This prevents bombarding notifications on app startup
        setTimeout(() => {
          rescheduleAllReminders(false).catch(console.error);
        }, 2000);
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      // Hide splash screen once everything is ready
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  // Show loading state while fonts are loading
  if (!fontsLoaded || !appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7BA17B" />
      </View>
    );
  }

  // Log font error but continue with fallback fonts
  if (fontError) {
    console.warn('Font loading error:', fontError);
  }

  const tokens = getThemeTokens(colorScheme);
  
  // Create navigation theme based on current color scheme
  const navTheme = colorScheme === 'light'
    ? {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: tokens.colors.background,
          card: tokens.colors.surface,
          border: tokens.colors.border,
          text: tokens.colors.text,
          primary: tokens.colors.primary,
        },
      }
    : {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: tokens.colors.background,
          card: tokens.colors.surface,
          border: tokens.colors.border,
          text: tokens.colors.text,
          primary: tokens.colors.primary,
        },
      };

  // Modal/screen header styles using theme tokens
  const headerStyle = {
    backgroundColor: tokens.colors.surface,
  };
  const headerTintColor = tokens.colors.text;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ThemeProvider value={navTheme}>
        <Stack
          screenOptions={{
            headerStyle,
            headerTintColor,
            headerTitleStyle: {
              fontFamily: 'Nunito-SemiBold',
            },
            contentStyle: {
              backgroundColor: tokens.colors.background,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Blood Pressure */}
          <Stack.Screen 
            name="bp-history" 
            options={{ 
              title: 'BP History',
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="add-bp" 
            options={{ 
              presentation: 'modal', 
              title: 'Add Blood Pressure',
              headerShown: true,
            }} 
          />
          
          {/* Medications */}
          <Stack.Screen 
            name="add-medication" 
            options={{ 
              presentation: 'modal', 
              title: 'Add Medication',
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="med-tracker" 
            options={{ 
              title: 'Medication Tracker',
              headerShown: true,
            }} 
          />
          
          {/* Migraine */}
          <Stack.Screen 
            name="add-migraine" 
            options={{ 
              presentation: 'modal', 
              title: 'Add Migraine',
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="migraine-tracker" 
            options={{ 
              title: 'Migraine Tracker',
              headerShown: true,
            }} 
          />
          
          {/* Supplements */}
          <Stack.Screen 
            name="add-supplement" 
            options={{ 
              presentation: 'modal', 
              title: 'Add Supplement',
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="supplement-tracker" 
            options={{ 
              title: 'Supplement Tracker',
              headerShown: true,
            }} 
          />
          
          {/* Meditation */}
          <Stack.Screen 
            name="add-meditation" 
            options={{ 
              presentation: 'modal', 
              title: 'Add Meditation',
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="meditation-tracker" 
            options={{ 
              title: 'Meditation Tracker',
              headerShown: true,
            }} 
          />
          
          {/* Journal */}
          <Stack.Screen 
            name="add-journal" 
            options={{ 
              presentation: 'modal', 
              title: 'Add Journal Entry',
              headerShown: true,
            }} 
          />
          
          {/* Appointments */}
          <Stack.Screen 
            name="add-appointment" 
            options={{ 
              presentation: 'modal', 
              title: 'Add Appointment',
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="appointment-tracker" 
            options={{ 
              title: 'Appointments',
              headerShown: true,
            }} 
          />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C5BFDC', // Lavender loading screen
  },
});

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <RootLayoutInner />
    </ThemePreferenceProvider>
  );
}
