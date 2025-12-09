import { create } from 'zustand';
import { getPortfolio, deposit as apiDeposit, executeSwap, Portfolio, Holding } from '@/services/api';

interface PortfolioState {
  portfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  // Actions
  fetchPortfolio: (userId: string) => Promise<void>;
  deposit: (userId: string, amount: number) => Promise<boolean>;
  buy: (userId: string, coinId: string, symbol: string, name: string, usdAmount: number) => Promise<boolean>;
  sell: (userId: string, coinId: string, cryptoAmount: number) => Promise<boolean>;
  swap: (userId: string, fromCoinId: string, fromAmount: number, toCoinId: string, toSymbol: string, toName: string) => Promise<boolean>;
  clearPortfolio: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolio: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchPortfolio: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const portfolio = await getPortfolio(userId);
      set({
        portfolio,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to load portfolio',
        isLoading: false,
      });
    }
  },

  deposit: async (userId: string, amount: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeposit(userId, amount);
      await get().fetchPortfolio(userId);
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Deposit failed',
        isLoading: false,
      });
      return false;
    }
  },

  buy: async (userId: string, coinId: string, symbol: string, name: string, usdAmount: number) => {
    set({ isLoading: true, error: null });
    try {
      await executeSwap({
        userId,
        type: 'buy',
        toCoinId: coinId,
        toSymbol: symbol,
        toName: name,
        usdAmount,
      });
      await get().fetchPortfolio(userId);
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Buy failed',
        isLoading: false,
      });
      return false;
    }
  },

  sell: async (userId: string, coinId: string, cryptoAmount: number) => {
    set({ isLoading: true, error: null });
    try {
      await executeSwap({
        userId,
        type: 'sell',
        fromCoinId: coinId,
        cryptoAmount,
      });
      await get().fetchPortfolio(userId);
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Sell failed',
        isLoading: false,
      });
      return false;
    }
  },

  swap: async (userId: string, fromCoinId: string, fromAmount: number, toCoinId: string, toSymbol: string, toName: string) => {
    set({ isLoading: true, error: null });
    try {
      await executeSwap({
        userId,
        type: 'swap',
        fromCoinId,
        fromAmount,
        toCoinId,
        toSymbol,
        toName,
      });
      await get().fetchPortfolio(userId);
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Swap failed',
        isLoading: false,
      });
      return false;
    }
  },

  clearPortfolio: () => {
    set({
      portfolio: null,
      error: null,
      lastUpdated: null,
    });
  },
}));

export default usePortfolioStore;
