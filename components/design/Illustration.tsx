/**
 * Illustration Component
 * 
 * Placeholder for illustrated mascot characters.
 * Uses Lottie animations when available, falls back to styled icons.
 * 
 * In production, replace with actual illustrations from:
 * - Undraw (https://undraw.co)
 * - Humaaans (https://humaaans.com)
 * - Open Peeps (https://openpeeps.com)
 * - Blush (https://blush.design)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { 
  getThemeTokens,
  borderRadius,
} from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { IconSymbol } from '@/components/ui/icon-symbol';

type IllustrationType = 
  | 'meditator' 
  | 'phone' 
  | 'yoga' 
  | 'flower' 
  | 'heart' 
  | 'journal'
  | 'health'
  | 'wellness'
  | 'empty'
  | 'success'
  | 'celebration';

interface IllustrationProps {
  type: IllustrationType;
  size?: 'small' | 'medium' | 'large' | 'hero';
  style?: ViewStyle;
}

// Icon and color mapping for each illustration type
const illustrationConfig: Record<IllustrationType, { icon: string; bgColor: string; iconColor: string }> = {
  meditator: { icon: 'leaf.fill', bgColor: 'primaryLight', iconColor: 'primary' },
  phone: { icon: 'iphone', bgColor: 'primaryLight', iconColor: 'primary' },
  yoga: { icon: 'figure.yoga', bgColor: 'accentLight', iconColor: 'accent' },
  flower: { icon: 'sparkles', bgColor: 'orchid', iconColor: 'orchid' },
  heart: { icon: 'heart.fill', bgColor: 'coral', iconColor: 'danger' },
  journal: { icon: 'book.fill', bgColor: 'accentLight', iconColor: 'accent' },
  health: { icon: 'heart.text.square', bgColor: 'coral', iconColor: 'danger' },
  wellness: { icon: 'leaf.fill', bgColor: 'primaryLight', iconColor: 'primary' },
  empty: { icon: 'tray', bgColor: 'border', iconColor: 'textMuted' },
  success: { icon: 'checkmark.circle.fill', bgColor: 'primaryLight', iconColor: 'success' },
  celebration: { icon: 'star.fill', bgColor: 'moodJoyful', iconColor: 'warning' },
};

const sizeConfig = {
  small: { container: 48, icon: 24 },
  medium: { container: 80, icon: 40 },
  large: { container: 120, icon: 60 },
  hero: { container: 160, icon: 80 },
};

export function Illustration({ 
  type,
  size = 'medium',
  style,
}: IllustrationProps) {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  
  const config = illustrationConfig[type];
  const dimensions = sizeConfig[size];

  // Get colors from tokens
  const getColor = (colorKey: string): string => {
    const colors = tokens.colors as Record<string, string>;
    return colors[colorKey] || colorKey;
  };

  const backgroundColor = getColor(config.bgColor) + '30'; // 30% opacity
  const iconColor = getColor(config.iconColor);

  return (
    <View 
      style={[
        styles.container,
        {
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.container / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <IconSymbol 
        name={config.icon} 
        size={dimensions.icon} 
        color={iconColor} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Illustration;
