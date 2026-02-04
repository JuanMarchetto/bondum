/**
 * Bondum Design Tokens - Colors
 * Extracted from design mockups
 */

export const colors = {
  // Primary - Violet/Purple
  primary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6', // Main brand color
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Secondary - Red (for discount cards, CTAs)
  secondary: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626', // Main red for cards
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Neutral/Gray
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Background colors
  background: {
    light: '#F8F7FC', // Light lavender background
    card: '#FFFFFF',
    header: '#8B5CF6', // Purple header
  },

  // Text colors
  text: {
    primary: '#171717',
    secondary: '#525252',
    muted: '#A3A3A3',
    inverse: '#FFFFFF',
    accent: '#8B5CF6',
  },

  // Status colors
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#059669',
  },

  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },

  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
  },

  // Token colors
  token: {
    bondum: '#8B5CF6', // $BONDUM token color
    usdc: '#2775CA', // USDC blue
  },
} as const

export type ColorKey = keyof typeof colors
