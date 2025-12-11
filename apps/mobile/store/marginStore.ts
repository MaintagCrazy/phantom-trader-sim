import { create } from 'zustand';
import api from '@/services/api';

export type PositionType = 'LONG' | 'SHORT';
export type PositionStatus = 'OPEN' | 'CLOSED' | 'LIQUIDATED';
export type LeverageLevel = 2 | 5 | 10;

export interface MarginPosition {
  id: string;
  userId: string;
  accountId: string | null;
  coinId: string;
  symbol: string;
  name: string;
  type: PositionType;
  leverage: number;
  entryPrice: number;
  amount: number;
  margin: number;
  liquidationPrice: number;
  status: PositionStatus;
  realizedPnl: number | null;
  closePrice: number | null;
  createdAt: string;
  closedAt: string | null;
  // Live calculated fields
  unrealizedPnl?: number;
  unrealizedPnlPercent?: number;
  currentValue?: number;
}

export interface LeverageOption {
  value: LeverageLevel;
  label: string;
  description: string;
  risk: 'Low' | 'Medium' | 'High';
}

export interface MarginStats {
  openPositionsCount: number;
  closedPositionsCount: number;
  totalMarginUsed: number;
  totalRealizedPnL: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
}

interface MarginState {
  positions: MarginPosition[];
  leverageOptions: LeverageOption[];
  stats: MarginStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPositions: (userId: string, accountId?: string, status?: string) => Promise<void>;
  fetchLivePositions: (userId: string, priceMap: Record<string, number>, accountId?: string) => Promise<void>;
  openPosition: (params: {
    userId: string;
    accountId?: string;
    coinId: string;
    symbol: string;
    name: string;
    type: PositionType;
    margin: number;
    leverage: LeverageLevel;
    currentPrice: number;
  }) => Promise<{ success: boolean; position?: MarginPosition; error?: string }>;
  closePosition: (positionId: string, userId: string, currentPrice: number) => Promise<{
    success: boolean;
    pnl?: number;
    marginReturn?: number;
    error?: string;
  }>;
  fetchStats: (userId: string, accountId?: string) => Promise<void>;
  fetchLeverageOptions: () => Promise<void>;
  clearPositions: () => void;
}

export const useMarginStore = create<MarginState>((set, get) => ({
  positions: [],
  leverageOptions: [
    { value: 2, label: '2x', description: 'Conservative - Liquidation at -50%', risk: 'Low' },
    { value: 5, label: '5x', description: 'Moderate - Liquidation at -20%', risk: 'Medium' },
    { value: 10, label: '10x', description: 'Aggressive - Liquidation at -10%', risk: 'High' },
  ],
  stats: null,
  isLoading: false,
  error: null,

  fetchPositions: async (userId: string, accountId?: string, status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params: any = { userId };
      if (accountId) params.accountId = accountId;
      if (status) params.status = status;

      const { data } = await api.get('/api/margin/positions', { params });
      set({
        positions: data.positions || [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to load positions',
        isLoading: false,
      });
    }
  },

  fetchLivePositions: async (userId: string, priceMap: Record<string, number>, accountId?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Format prices as query string: "bitcoin:65000,ethereum:3500"
      const pricesStr = Object.entries(priceMap)
        .map(([coinId, price]) => `${coinId}:${price}`)
        .join(',');

      const params: any = { userId, prices: pricesStr };
      if (accountId) params.accountId = accountId;

      const { data } = await api.get('/api/margin/positions/live', { params });
      set({
        positions: data.positions || [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to load positions',
        isLoading: false,
      });
    }
  },

  openPosition: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/api/margin/open', params);

      // Add new position to the list
      set((state) => ({
        positions: [data.position, ...state.positions],
        isLoading: false,
      }));

      return { success: true, position: data.position };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to open position';
      set({
        error: errorMessage,
        isLoading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  closePosition: async (positionId: string, userId: string, currentPrice: number) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/api/margin/close', {
        positionId,
        userId,
        currentPrice,
      });

      // Update position in the list
      set((state) => ({
        positions: state.positions.map((p) =>
          p.id === positionId
            ? {
                ...p,
                status: data.position.status,
                realizedPnl: data.position.realizedPnl,
                closePrice: data.position.closePrice,
                closedAt: data.position.closedAt,
              }
            : p
        ),
        isLoading: false,
      }));

      return {
        success: true,
        pnl: data.pnl,
        marginReturn: data.marginReturn,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to close position';
      set({
        error: errorMessage,
        isLoading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  fetchStats: async (userId: string, accountId?: string) => {
    try {
      const params: any = { userId };
      if (accountId) params.accountId = accountId;

      const { data } = await api.get('/api/margin/stats', { params });
      set({ stats: data.stats });
    } catch (error: any) {
      console.error('Failed to fetch margin stats:', error);
    }
  },

  fetchLeverageOptions: async () => {
    try {
      const { data } = await api.get('/api/margin/leverage-options');
      const options: LeverageOption[] = data.options.map((value: number) => ({
        value,
        ...data.descriptions[value],
      }));
      set({ leverageOptions: options });
    } catch (error: any) {
      console.error('Failed to fetch leverage options:', error);
    }
  },

  clearPositions: () => {
    set({
      positions: [],
      stats: null,
      error: null,
    });
  },
}));

export default useMarginStore;
