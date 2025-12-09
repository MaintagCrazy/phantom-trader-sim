// Coin types
export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  priceChange24h: number;
  totalVolume: number;
  circulatingSupply: number;
  ath: number;
  sparkline?: number[];
}

// Portfolio types
export interface Holding {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  image?: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  cashBalance: number;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdings: Holding[];
}

// Transaction types
export type TransactionType = 'DEPOSIT' | 'SWAP' | 'BUY' | 'SELL';

export interface Transaction {
  id: string;
  type: TransactionType;
  fromCoinId?: string;
  fromSymbol?: string;
  fromAmount?: number;
  toCoinId?: string;
  toSymbol?: string;
  toAmount?: number;
  depositAmount?: number;
  priceAtTime?: number;
  totalUsdValue: number;
  createdAt: string;
}

// User types
export interface User {
  id: string;
  username: string | null;
  createdAt: string;
  hasPortfolio: boolean;
}

// API Response types
export interface PricesResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

export interface SwapPreviewResponse {
  fromPrice: number | null;
  toPrice: number | null;
  usdValue: number | null;
  fromAmount: number | null;
  toAmount: number | null;
  exchangeRate: number | null;
}

export interface SwapExecuteResponse {
  success: boolean;
  type: 'buy' | 'sell' | 'swap';
  message: string;
  cryptoAmount?: number;
  usdAmount?: number;
  fromAmount?: number;
  toAmount?: number;
  price?: number;
  fromPrice?: number;
  toPrice?: number;
  usdValue?: number;
}

// Color constants
export const colors = {
  purpleHeart: '#4E44CE',
  purpleDark: '#3B1E90',
  purpleLight: '#AB9FF2',
  darkBg: '#131314',
  cardBg: '#1C1C1E',
  shark: '#2C2D30',
  white: '#FFFFFF',
  gray: '#8E8E93',
  lightGray: '#D1D3CF',
  green: '#30D158',
  red: '#FF453A',
  teal: '#3DDAD7',
} as const;
