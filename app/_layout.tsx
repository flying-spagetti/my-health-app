import { initDb } from '@/services/db';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { darkTheme, lightTheme } from '@/constants/theme';
import { ThemePreferenceProvider, useThemePreference } from '@/hooks/use-theme-preference';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutInner() {
  const { colorScheme } = useThemePreference();

  useEffect(() => {
    initDb();
  }, []);

  const tokens = colorScheme === 'light' ? lightTheme : darkTheme;
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

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="bp-history" 
          options={{ 
            title: 'BP History',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#0F1720',
            },
            headerTintColor: '#EDF2F7',
          }} 
        />
        <Stack.Screen 
          name="add-bp" 
          options={{ 
            presentation: 'modal', 
            title: 'Add Blood Pressure',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#0F1720',
            },
            headerTintColor: '#EDF2F7',
          }} 
        />
        <Stack.Screen 
          name="add-medication" 
          options={{ 
            presentation: 'modal', 
            title: 'Add Medication',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#0F1720',
            },
            headerTintColor: '#EDF2F7',
          }} 
        />
        <Stack.Screen 
          name="add-migraine" 
          options={{ 
            presentation: 'modal', 
            title: 'Add Migraine',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#0F1720',
            },
            headerTintColor: '#EDF2F7',
          }} 
        />
        <Stack.Screen 
          name="add-supplement" 
          options={{ 
            presentation: 'modal', 
            title: 'Add Supplement',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#0F1720',
            },
            headerTintColor: '#EDF2F7',
          }} 
        />
        <Stack.Screen 
          name="add-meditation" 
          options={{ 
            presentation: 'modal', 
            title: 'Add Meditation',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#0F1720',
            },
            headerTintColor: '#EDF2F7',
          }} 
        />
        <Stack.Screen 
          name="add-journal" 
          options={{ 
            presentation: 'modal', 
            title: 'Add Journal Entry',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#0F1720',
            },
            headerTintColor: '#EDF2F7',
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <RootLayoutInner />
    </ThemePreferenceProvider>
  );
}
