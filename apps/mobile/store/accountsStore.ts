import { create } from 'zustand';
import api from '@/services/api';

export interface Account {
  id: string;
  name: string;
  isActive: boolean;
  portfolioValue: number;
  cashBalance: number;
  holdingsCount: number;
  createdAt: string;
}

interface AccountsState {
  accounts: Account[];
  activeAccount: Account | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAccounts: (userId: string) => Promise<void>;
  createAccount: (userId: string, name: string) => Promise<boolean>;
  switchAccount: (userId: string, accountId: string) => Promise<boolean>;
  renameAccount: (userId: string, accountId: string, name: string) => Promise<boolean>;
  deleteAccount: (userId: string, accountId: string) => Promise<boolean>;
  migrateToAccounts: (userId: string) => Promise<boolean>;
  clearAccounts: () => void;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  activeAccount: null,
  isLoading: false,
  error: null,

  fetchAccounts: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/api/accounts', { params: { userId } });
      const accounts = data.accounts || [];
      const activeAccount = accounts.find((a: Account) => a.isActive) || accounts[0] || null;
      set({
        accounts,
        activeAccount,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to load accounts',
        isLoading: false,
      });
    }
  },

  createAccount: async (userId: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/api/accounts', { userId, name });
      await get().fetchAccounts(userId);
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to create account',
        isLoading: false,
      });
      return false;
    }
  },

  switchAccount: async (userId: string, accountId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/api/accounts/switch', { userId, accountId });
      await get().fetchAccounts(userId);
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to switch account',
        isLoading: false,
      });
      return false;
    }
  },

  renameAccount: async (userId: string, accountId: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/api/accounts/${accountId}`, { userId, name });
      await get().fetchAccounts(userId);
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to rename account',
        isLoading: false,
      });
      return false;
    }
  },

  deleteAccount: async (userId: string, accountId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/accounts/${accountId}`, { params: { userId } });
      await get().fetchAccounts(userId);
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to delete account',
        isLoading: false,
      });
      return false;
    }
  },

  migrateToAccounts: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/api/accounts/migrate', { userId });
      await get().fetchAccounts(userId);
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to migrate accounts',
        isLoading: false,
      });
      return false;
    }
  },

  clearAccounts: () => {
    set({
      accounts: [],
      activeAccount: null,
      error: null,
    });
  },
}));

export default useAccountsStore;
