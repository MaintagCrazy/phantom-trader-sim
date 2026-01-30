import { create } from 'zustand';
import { getCoins, getCoin, getCoinChart, Coin } from '@/services/api';

// Re-export Coin type for use in components
export type { Coin } from '@/services/api';

// Price simulation - adds realistic fluctuations to make the app feel dynamic
const PRICE_SIMULATION_INTERVAL = 3000; // 3 seconds
const MAX_FLUCTUATION_PERCENT = 0.15; // ±0.15% max fluctuation per tick

// Generate a random fluctuation multiplier
const getFluctuation = () => {
  const fluctuation = (Math.random() - 0.5) * 2 * (MAX_FLUCTUATION_PERCENT / 100);
  return 1 + fluctuation;
};

// Apply simulated fluctuations to coins
const applyPriceSimulation = (coins: Coin[]): Coin[] => {
  return coins.map(coin => {
    const priceFluctuation = getFluctuation();
    const newPrice = coin.currentPrice * priceFluctuation;

    // Also fluctuate the 24h change slightly for visual feedback
    const changeFluctuation = (Math.random() - 0.5) * 0.1;
    const newChange = coin.priceChange24h + changeFluctuation;

    return {
      ...coin,
      currentPrice: newPrice,
      priceChange24h: newChange,
    };
  });
};

interface CoinsState {
  coins: Coin[];
  baseCoins: Coin[]; // Original prices from API
  selectedCoin: Coin | null;
  chartData: [number, number][] | null;
  chartDays: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  simulationInterval: ReturnType<typeof setInterval> | null;

  // Actions
  fetchCoins: (page?: number, perPage?: number, search?: string) => Promise<void>;
  fetchCoin: (id: string) => Promise<void>;
  fetchChart: (id: string, days?: string) => Promise<void>;
  setChartDays: (days: string) => void;
  clearSelectedCoin: () => void;
  refreshPrices: () => Promise<void>;
  startPriceSimulation: () => void;
  stopPriceSimulation: () => void;
  simulatePriceTick: () => void;
}

export const useCoinsStore = create<CoinsState>((set, get) => ({
  coins: [],
  baseCoins: [],
  selectedCoin: null,
  chartData: null,
  chartDays: '7',
  isLoading: false,
  error: null,
  lastUpdated: null,
  simulationInterval: null,

  fetchCoins: async (page = 1, perPage = 20, search?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { coins } = await getCoins(page, perPage, search);
      set({
        coins: applyPriceSimulation(coins),
        baseCoins: coins,
        isLoading: false,
        lastUpdated: Date.now(),
      });

      // Start simulation if not already running
      const { simulationInterval, startPriceSimulation } = get();
      if (!simulationInterval) {
        startPriceSimulation();
      }
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
    const { baseCoins } = get();
    if (baseCoins.length === 0) return;
    await get().fetchCoins(1, baseCoins.length);
  },

  startPriceSimulation: () => {
    const { simulationInterval } = get();
    if (simulationInterval) return; // Already running

    const interval = setInterval(() => {
      get().simulatePriceTick();
    }, PRICE_SIMULATION_INTERVAL);

    set({ simulationInterval: interval });
  },

  stopPriceSimulation: () => {
    const { simulationInterval } = get();
    if (simulationInterval) {
      clearInterval(simulationInterval);
      set({ simulationInterval: null });
    }
  },

  simulatePriceTick: () => {
    const { baseCoins } = get();
    if (baseCoins.length === 0) return;

    // Apply new random fluctuations
    set({ coins: applyPriceSimulation(baseCoins) });
  },
}));

export default useCoinsStore;
