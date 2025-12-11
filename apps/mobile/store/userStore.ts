import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUser, getUser } from '@/services/api';

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

interface UserState {
  userId: string | null;
  username: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initUser: (username?: string) => Promise<void>;
  loadUser: () => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null,
      username: null,
      isLoading: false,
      error: null,

      initUser: async (username?: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await createUser(username);
          set({
            userId: user.id,
            username: user.username,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to create user',
            isLoading: false,
          });
        }
      },

      loadUser: async () => {
        const { userId } = get();
        if (!userId) return;

        set({ isLoading: true, error: null });
        try {
          const user = await getUser(userId);
          set({
            username: user.username,
            isLoading: false,
          });
        } catch (error: any) {
          // User might not exist anymore, clear
          set({
            userId: null,
            username: null,
            error: null,
            isLoading: false,
          });
        }
      },

      clearUser: () => {
        set({
          userId: null,
          username: null,
          error: null,
        });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        userId: state.userId,
        username: state.username,
      }),
    }
  )
);

export default useUserStore;
