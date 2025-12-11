import { StyleSheet } from 'react-native';
import colors from './colors';

export const commonStyles = StyleSheet.create({
  // Layout
  flex1: {
    flex: 1,
  },
  flexRow: {
    flexDirection: 'row',
  },
  flexRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexRowJustifyAround: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsCenter: {
    alignItems: 'center',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  itemsEnd: {
    alignItems: 'flex-end',
  },

  // Backgrounds
  darkBg: {
    backgroundColor: colors.darkBg,
  },
  cardBg: {
    backgroundColor: colors.cardBg,
  },

  // Padding & Margin
  p4: {
    padding: 16,
  },
  px4: {
    paddingHorizontal: 16,
  },
  py3: {
    paddingVertical: 12,
  },
  py4: {
    paddingVertical: 16,
  },
  py6: {
    paddingVertical: 24,
  },
  py8: {
    paddingVertical: 32,
  },
  py12: {
    paddingVertical: 48,
  },
  pb4: {
    paddingBottom: 16,
  },
  pb6: {
    paddingBottom: 24,
  },
  mb2: {
    marginBottom: 8,
  },
  mb3: {
    marginBottom: 12,
  },
  mb4: {
    marginBottom: 16,
  },
  mb6: {
    marginBottom: 24,
  },
  mb8: {
    marginBottom: 32,
  },
  mt2: {
    marginTop: 8,
  },
  mt4: {
    marginTop: 16,
  },
  mr2: {
    marginRight: 8,
  },
  mr3: {
    marginRight: 12,
  },

  // Text styles
  textWhite: {
    color: colors.white,
  },
  textGray: {
    color: colors.gray,
  },
  textSmall: {
    fontSize: 12,
  },
  textBase: {
    fontSize: 14,
  },
  textLg: {
    fontSize: 18,
  },
  textXl: {
    fontSize: 20,
  },
  text3xl: {
    fontSize: 32,
  },
  text4xl: {
    fontSize: 36,
  },
  fontSemibold: {
    fontWeight: '600',
  },
  fontBold: {
    fontWeight: 'bold',
  },

  // Border radius
  roundedXl: {
    borderRadius: 12,
  },
  rounded2xl: {
    borderRadius: 16,
  },
  rounded3xl: {
    borderRadius: 20,
  },
  roundedFull: {
    borderRadius: 9999,
  },

  // Dimensions
  w10: {
    width: 40,
  },
  w12: {
    width: 48,
  },
  w14: {
    width: 56,
  },
  w20: {
    width: 80,
  },
  w24: {
    width: 96,
  },
  h10: {
    height: 40,
  },
  h12: {
    height: 48,
  },
  h14: {
    height: 56,
  },
  h20: {
    height: 80,
  },
  h24: {
    height: 96,
  },
  h48: {
    height: 192,
  },

  // Specific components
  roundedCircle: {
    borderRadius: 9999,
  },
  overflowHidden: {
    overflow: 'hidden',
  },
});

// Common component styles
export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.purpleHeart,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primarySmall: {
    backgroundColor: colors.purpleHeart,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryLarge: {
    backgroundColor: colors.purpleHeart,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondary: {
    backgroundColor: colors.cardBg,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.purpleHeart,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    backgroundColor: colors.shark,
  },
});

export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
  },
});

export const tokenCircle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.shark,
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden' as const,
};

export const inputStyles = StyleSheet.create({
  input: {
    color: colors.white,
    fontSize: 14,
  },
  inputLarge: {
    color: colors.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default commonStyles;
