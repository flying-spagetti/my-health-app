import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

type ThemePreference = 'system' | 'light' | 'dark';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  colorScheme: 'light';
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export function ThemePreferenceProvider({ children }: Props) {
  const systemScheme = useRNColorScheme() ?? 'light';
  const [preference, setPreference] = useState<ThemePreference>('system');

  // Derive the effective scheme from the preference + system
  const colorScheme = useMemo<('light')>(() => {
    if (preference === 'system') {
      return 'light';
    }
    return 'light';
  }, [preference, systemScheme]);

  // In a real app you might persist this with SecureStore; for now we keep it in memory.

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      colorScheme,
    }),
    [preference, colorScheme],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  }
  return ctx;
}

