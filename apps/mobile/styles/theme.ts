// BMO Wallet Theme - Exact Match
// Based on vinnyhoward/rn-crypto-wallet

export const Theme = {
  colors: {
    // Primary palette
    primary: '#8878F4',
    primaryDark: '#6155AC',
    dark: '#1A1A1A',
    darkLight: '#262626',
    accent: '#F97068',
    background: '#0D0D0D',
    highlight: '#D1D646',

    // Neutrals
    white: '#FFFFFF',
    lightGrey: '#A0A0A0',
    grey: '#494949',
    darkGrey: '#191919',

    // Status colors
    error: '#FF0000',
    success: '#30D158',
    warning: '#FFD60A',

    // Blockchain specific
    ethereum: '#C8B3F4',
    solana: '#00DCFA',
    bitcoin: '#F7931A',

    // Gradients (as arrays for LinearGradient)
    primaryLinearGradient: ['#8878F4', '#6155AC', '#1A1A1A'] as const,
    secondaryLinearGradient: ['#262626', '#1A1A1A', '#0D0D0D'] as const,
    cardGradient: ['#2A2440', '#1A1A1A'] as const,
  },

  fonts: {
    families: {
      openRegular: 'OpenSans_400Regular',
      openBold: 'OpenSans_700Bold',
      robotoRegular: 'Roboto_400Regular',
      robotoBold: 'Roboto_700Bold',
    },
    sizes: {
      small: 12,
      normal: 14,
      large: 16,
      header: 18,
      title: 24,
      huge: 32,
      uberHuge: 48,
    },
    weights: {
      normal: '400' as const,
      bold: '700' as const,
    },
  },

  spacing: {
    tiny: 4,
    small: 8,
    medium: 16,
    large: 24,
    huge: 32,
    extraHuge: 48,
  },

  borderRadius: {
    small: 4,
    default: 8,
    large: 16,
    extraLarge: 24,
    round: 999,
  },

  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
} as const;

export type ThemeType = typeof Theme;
export default Theme;
