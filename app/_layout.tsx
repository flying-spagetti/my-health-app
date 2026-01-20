import { initDb } from '@/services/db';
import { rescheduleAllReminders, clearBadge, incrementBadge } from '@/services/reminders';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState } from 'react-native';
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
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize database
        initDb();
        
        // Check and reschedule reminders if needed (don't force - only reschedule if missing)
        // This prevents bombarding notifications on app startup
        setTimeout(() => {
          rescheduleAllReminders(false).catch(() => {});
        }, 2000);
      } catch (e) {
        // Error during app initialization
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Set up notification listeners
  useEffect(() => {
    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Increment badge count when notification is received while app is in foreground
      incrementBadge().catch(() => {});
    });

    // This listener is fired whenever a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Clear badge when user interacts with notification
      clearBadge().catch(() => {});
      
      // Navigate based on notification type
      if (data?.type === 'medication' || data?.type === 'supplement') {
        router.push('/med-tracker');
      } else if (data?.type === 'appointment') {
        router.push('/appointment-tracker');
      } else if (data?.type === 'meditation') {
        router.push('/meditation-tracker');
      }
    });

    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);

  // Clear badge count when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // Clear badge when app is opened
        clearBadge().catch(() => {});
      }
    });

    return () => {
      subscription.remove();
    };
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
    // Font loading error - using fallback fonts
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
          
          {/* Doctor Visit Summary */}
          <Stack.Screen
            name="doctor-visit"
            options={{
              title: 'Doctor Visit Summary',
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
