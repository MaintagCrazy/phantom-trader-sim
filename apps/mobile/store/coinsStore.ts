import { create } from 'zustand';
import { getCoins, getCoin, getCoinChart, Coin } from '@/services/api';

// Re-export Coin type for use in components
export type { Coin } from '@/services/api';

interface CoinsState {
  coins: Coin[];
  selectedCoin: Coin | null;
  chartData: [number, number][] | null;
  chartDays: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  // Actions
  fetchCoins: (page?: number, perPage?: number, search?: string) => Promise<void>;
  fetchCoin: (id: string) => Promise<void>;
  fetchChart: (id: string, days?: string) => Promise<void>;
  setChartDays: (days: string) => void;
  clearSelectedCoin: () => void;
  refreshPrices: () => Promise<void>;
}

export const useCoinsStore = create<CoinsState>((set, get) => ({
  coins: [],
  selectedCoin: null,
  chartData: null,
  chartDays: '7',
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchCoins: async (page = 1, perPage = 20, search?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { coins } = await getCoins(page, perPage, search);
      set({
        coins,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load coins',
        isLoading: false,
      });
    }
  },

  fetchCoin: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const coin = await getCoin(id);
      set({
        selectedCoin: coin,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load coin',
        isLoading: false,
      });
    }
  },

  fetchChart: async (id: string, days?: string) => {
    const chartDays = days || get().chartDays;
    try {
      const { prices } = await getCoinChart(id, chartDays);
      set({ chartData: prices, chartDays });
    } catch (error: any) {
      console.error('Failed to load chart:', error);
    }
  },

  setChartDays: (days: string) => {
    set({ chartDays: days });
  },

  clearSelectedCoin: () => {
    set({
      selectedCoin: null,
      chartData: null,
    });
  },

  refreshPrices: async () => {
    const { coins } = get();
    if (coins.length === 0) return;
    await get().fetchCoins(1, coins.length);
  },
}));

export default useCoinsStore;
