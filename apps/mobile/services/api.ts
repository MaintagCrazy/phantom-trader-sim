import axios, { AxiosError } from 'axios';
import API_BASE_URL from '@/constants/api';

// Log the API URL for debugging
console.log('[API] Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for Railway cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request/response interceptors for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.data);
    return response;
  },
  (error: AxiosError) => {
    console.error('[API] Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// Types
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

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'SWAP' | 'BUY' | 'SELL' | 'MARGIN_OPEN' | 'MARGIN_CLOSE';
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

export interface MarginPosition {
  id: string;
  userId: string;
  coinId: string;
  symbol: string;
  name: string;
  type: 'LONG' | 'SHORT';
  leverage: number;
  entryPrice: number;
  amount: number;
  margin: number;
  liquidationPrice: number;
  status: 'OPEN' | 'CLOSED';
  realizedPnl: number | null;
  closePrice: number | null;
  createdAt: string;
  closedAt: string | null;
}

// Margin positions endpoint
export async function getMarginPositions(userId: string): Promise<{ positions: MarginPosition[]; count: number }> {
  const { data } = await api.get('/api/margin/positions', { params: { userId } });
  return data;
}

export interface User {
  id: string;
  username: string | null;
  createdAt: string;
  hasPortfolio: boolean;
}

// User endpoints
export async function createUser(username?: string): Promise<User> {
  const { data } = await api.post('/api/user', { username });
  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await api.get(`/api/user/${id}`);
  return data;
}

// Portfolio endpoints
export async function getPortfolio(userId: string): Promise<Portfolio> {
  const { data } = await api.get('/api/portfolio', { params: { userId } });
  return data;
}

// Deposit
export async function deposit(userId: string, amount: number): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post('/api/deposit', { userId, amount });
  return data;
}

// Swap/Trade endpoints
export async function executeSwap(params: {
  userId: string;
  type: 'buy' | 'sell' | 'swap';
  fromCoinId?: string;
  fromAmount?: number;
  toCoinId?: string;
  toSymbol?: string;
  toName?: string;
  usdAmount?: number;
  cryptoAmount?: number;
}) {
  const { data } = await api.post('/api/swap/execute', params);
  return data;
}

export async function previewSwap(params: {
  fromCoinId?: string;
  toCoinId?: string;
  fromAmount?: number;
  usdAmount?: number;
}) {
  const { data } = await api.post('/api/swap/preview', params);
  return data;
}

// Coin endpoints
export async function getCoins(page = 1, perPage = 20, search?: string): Promise<{ coins: Coin[]; page: number; perPage: number }> {
  const { data } = await api.get('/api/coins', { params: { page, perPage, search } });
  return data;
}

export async function getCoin(id: string): Promise<Coin> {
  const { data } = await api.get(`/api/coins/${id}`);
  return data;
}

export async function getCoinChart(id: string, days: string = '7'): Promise<{ coinId: string; days: string; prices: [number, number][] }> {
  const { data } = await api.get(`/api/coins/${id}/chart`, { params: { days } });
  return data;
}

// Prices endpoint
export async function getPrices(ids?: string[]): Promise<Record<string, { usd: number; usd_24h_change?: number }>> {
  const { data } = await api.get('/api/prices', { params: { ids: ids?.join(',') } });
  return data;
}

// Transactions endpoint
export async function getTransactions(userId: string, page = 1, perPage = 20): Promise<{
  transactions: Transaction[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}> {
  const { data } = await api.get('/api/transactions', { params: { userId, page, perPage } });
  return data;
}

export default api;
