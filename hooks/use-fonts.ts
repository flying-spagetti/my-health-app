/**
 * Custom font loading hook for the Health & Wellness app
 * Loads Caveat (handwritten display) and Nunito (body) fonts
 */

import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

// Import fonts from @expo-google-fonts packages
import {
  Caveat_400Regular,
  Caveat_500Medium,
  Caveat_600SemiBold,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat';

import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

// Font assets map
export const fontAssets = {
  // Caveat - Handwritten display font
  'Caveat-Regular': Caveat_400Regular,
  'Caveat-Medium': Caveat_500Medium,
  'Caveat-SemiBold': Caveat_600SemiBold,
  'Caveat-Bold': Caveat_700Bold,
  
  // Nunito - Friendly body font
  'Nunito-Regular': Nunito_400Regular,
  'Nunito-Medium': Nunito_500Medium,
  'Nunito-SemiBold': Nunito_600SemiBold,
  'Nunito-Bold': Nunito_700Bold,
};

/**
 * Hook to load custom fonts
 * Returns loading state and error if any
 */
export function useFonts(): { fontsLoaded: boolean; fontError: Error | null } {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync(fontAssets);
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontError(error instanceof Error ? error : new Error('Failed to load fonts'));
        // Still set fonts as "loaded" so app continues with fallback fonts
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  return { fontsLoaded, fontError };
}

/**
 * Font family names to use in styles
 * These match the keys used in fontAssets
 */
export const FontFamily = {
  // Display (handwritten)
  displayRegular: 'Caveat-Regular',
  displayMedium: 'Caveat-Medium',
  displaySemiBold: 'Caveat-SemiBold',
  displayBold: 'Caveat-Bold',
  
  // Body
  bodyRegular: 'Nunito-Regular',
  bodyMedium: 'Nunito-Medium',
  bodySemiBold: 'Nunito-SemiBold',
  bodyBold: 'Nunito-Bold',
} as const;

/**
 * Get the appropriate font family with fallback
 * Use this when fonts might not be loaded yet
 */
export function getFontFamily(
  fontName: keyof typeof FontFamily,
  fallback: string = 'System'
): string {
  return FontFamily[fontName] || fallback;
}
