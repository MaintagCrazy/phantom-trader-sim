import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';

// Use localStorage for web, AsyncStorage for native
const storage = Platform.OS === 'web'
  ? {
      getItem: (name: string) => {
        const value = localStorage.getItem(name);
        return Promise.resolve(value);
      },
      setItem: (name: string, value: string) => {
        localStorage.setItem(name, value);
        return Promise.resolve();
      },
      removeItem: (name: string) => {
        localStorage.removeItem(name);
        return Promise.resolve();
      },
    }
  : AsyncStorage;

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

export const useAccountsStore = create<AccountsState>()(
  persist(
    (set, get) => ({
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
          set({ isLoading: false });
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
          set({ isLoading: false });
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
          set({ isLoading: false });
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
          set({ isLoading: false });
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
          set({ isLoading: false });
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
    }),
    {
      name: 'accounts-storage',
      storage: createJSONStorage(() => storage),
      // Only persist accounts and activeAccount, not loading/error states
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccount: state.activeAccount,
      }),
    }
  )
);

export default useAccountsStore;
