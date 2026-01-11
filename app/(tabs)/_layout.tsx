import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getThemeTokens, shadows, borderRadius } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

export default function TabLayout() {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.textMuted,
        tabBarStyle: {
          backgroundColor: tokens.colors.surface,
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
          ...shadows.medium,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Nunito-Medium',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      {/* Home - Dashboard with mixed content */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? 'house.fill' : 'house'} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Mood - Journal/Mood tracking with calendar */}
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Mood',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? 'face.smiling.fill' : 'face.smiling'} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Wellness - Meditation and routines */}
      <Tabs.Screen
        name="wellness"
        options={{
          title: 'Wellness',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? 'leaf.fill' : 'leaf'} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Health - BP, Medications, Migraines */}
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? 'heart.fill' : 'heart'} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Profile - Settings */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? 'person.fill' : 'person'} 
              color={color} 
            />
          ),
        }}
      />

      {/* Hide the old journal and meds tabs */}
      <Tabs.Screen
        name="journal"
        options={{
          href: null, // Hide from tab bar, redirects to mood
        }}
      />
      <Tabs.Screen
        name="meds"
        options={{
          href: null, // Hide from tab bar, redirects to health
        }}
      />
    </Tabs>
  );
}
