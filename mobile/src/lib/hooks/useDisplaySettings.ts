import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore, getFontSizeMultiplier, FontSize } from '@/lib/state/settings-store';

export interface DisplayStyles {
  // Font sizes (already multiplied)
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  // Colors based on mode
  colors: {
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    card: string;
    border: string;
    primary: string;
    primaryLight: string;
  };
  // Is dark mode active
  isDarkMode: boolean;
  // Is high contrast active
  isHighContrast: boolean;
  // Font size setting
  fontSizeSetting: FontSize;
  // Multiplier for custom calculations
  fontMultiplier: number;
}

const BASE_FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

const LIGHT_COLORS = {
  background: '#FFFBF5',
  backgroundSecondary: '#F9FAFB',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
};

const DARK_COLORS = {
  background: '#111827',
  backgroundSecondary: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  card: '#1F2937',
  border: '#374151',
  primary: '#3B82F6',
  primaryLight: '#1E3A5F',
};

const HIGH_CONTRAST_LIGHT_COLORS = {
  background: '#FFFFFF',
  backgroundSecondary: '#F3F4F6',
  text: '#000000',
  textSecondary: '#374151',
  textMuted: '#4B5563',
  card: '#FFFFFF',
  border: '#000000',
  primary: '#1D4ED8',
  primaryLight: '#BFDBFE',
};

const HIGH_CONTRAST_DARK_COLORS = {
  background: '#000000',
  backgroundSecondary: '#1F2937',
  text: '#FFFFFF',
  textSecondary: '#E5E7EB',
  textMuted: '#D1D5DB',
  card: '#111827',
  border: '#FFFFFF',
  primary: '#60A5FA',
  primaryLight: '#1E3A5F',
};

export function useDisplaySettings(): DisplayStyles {
  const taillePolice = useSettingsStore((s) => s.taillePolice);
  const modeSombre = useSettingsStore((s) => s.modeSombre);
  const contrasteEleve = useSettingsStore((s) => s.contrasteEleve);

  return useMemo(() => {
    const multiplier = getFontSizeMultiplier(taillePolice);
    
    // Calculate scaled font sizes
    const fontSize = {
      xs: Math.round(BASE_FONT_SIZES.xs * multiplier),
      sm: Math.round(BASE_FONT_SIZES.sm * multiplier),
      base: Math.round(BASE_FONT_SIZES.base * multiplier),
      lg: Math.round(BASE_FONT_SIZES.lg * multiplier),
      xl: Math.round(BASE_FONT_SIZES.xl * multiplier),
      '2xl': Math.round(BASE_FONT_SIZES['2xl'] * multiplier),
      '3xl': Math.round(BASE_FONT_SIZES['3xl'] * multiplier),
      '4xl': Math.round(BASE_FONT_SIZES['4xl'] * multiplier),
    };

    // Determine colors based on mode and contrast
    let colors;
    if (modeSombre) {
      colors = contrasteEleve ? HIGH_CONTRAST_DARK_COLORS : DARK_COLORS;
    } else {
      colors = contrasteEleve ? HIGH_CONTRAST_LIGHT_COLORS : LIGHT_COLORS;
    }

    return {
      fontSize,
      colors,
      isDarkMode: modeSombre,
      isHighContrast: contrasteEleve,
      fontSizeSetting: taillePolice,
      fontMultiplier: multiplier,
    };
  }, [taillePolice, modeSombre, contrasteEleve]);
}

// Helper component styles generator
export function getTextStyle(display: DisplayStyles, size: keyof DisplayStyles['fontSize'] = 'base') {
  return {
    fontSize: display.fontSize[size],
    color: display.colors.text,
  };
}

export function getSecondaryTextStyle(display: DisplayStyles, size: keyof DisplayStyles['fontSize'] = 'base') {
  return {
    fontSize: display.fontSize[size],
    color: display.colors.textSecondary,
  };
}

export function getCardStyle(display: DisplayStyles) {
  return {
    backgroundColor: display.colors.card,
    borderColor: display.colors.border,
  };
}

export function getBackgroundStyle(display: DisplayStyles) {
  return {
    backgroundColor: display.colors.background,
  };
}
