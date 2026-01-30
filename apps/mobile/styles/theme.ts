// Based on vinnyhoward/rn-crypto-wallet theme
// Exact same colors, adapted for React Native (numbers instead of px strings)

export type ThemeType = typeof Theme;

const Theme = {
  colors: {
    // Exact BMO Wallet colors
    primary: "#8878F4",
    dark: "#131314",
    lightDark: "#1C1C1E",
    accent: "#F97068",
    background: "#EDF2EF",
    highlight: "#D1D646",
    white: "#FFFFFF",
    lightGrey: "#A0A0A0",
    grey: "#494949",
    error: "#FF0000",
    ethereum: "#C8B3F4",
    solana: "#00DCFA",
    // Additional useful colors
    success: "#30D158",
    warning: "#FFD60A",
    // Gradients
    primaryLinearGradient: ["#8878F4", "#6155AC"] as const,
    secondaryLinearGradient: ["#131314", "#131314"] as const,
  },
  fonts: {
    families: {
      openRegular: "OpenSans_400Regular",
      openBold: "OpenSans_700Bold",
      robotoRegular: "Roboto_400Regular",
      robotoBold: "Roboto_700Bold",
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
      normal: "400" as const,
      bold: "700" as const,
    },
    colors: {
      primary: "#FFFFFF",
      dark: "#191919",
      accent: "#F97068",
      background: "#EDF2EF",
      highlight: "#D1D646",
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
} as const;

export default Theme;
