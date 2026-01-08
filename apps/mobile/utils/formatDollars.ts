// BMO Wallet Utility - Format Dollar Amount
// Adapted from vinnyhoward/rn-crypto-wallet

export const formatDollar = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
