// BMO Wallet Utility - Capitalize First Letter
// Adapted from vinnyhoward/rn-crypto-wallet

export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
