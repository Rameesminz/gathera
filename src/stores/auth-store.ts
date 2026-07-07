import Cookies from 'js-cookie';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';
import { updateProfile as updateUserProfile } from '@/lib/api/users';
import { TOKEN_KEYS } from '@/lib/constants';
import type { PublicUser } from '@/types';

interface AuthState {
  user: PublicUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    mobileNumber?: string,
  ) => Promise<void>;
  updateProfile: (input: { mobileNumber?: string | null }) => Promise<PublicUser>;
  setOAuthTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = await authApi.login({ email, password });
          set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
        } catch (error) {
          set({
            isLoading: false,
            error: getApiErrorMessage(error, 'Login failed'),
          });
          throw error;
        }
      },

      register: async (email, password, displayName, mobileNumber) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = await authApi.register({
            email,
            password,
            displayName,
            mobileNumber,
          });
          set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
        } catch (error) {
          set({
            isLoading: false,
            error: getApiErrorMessage(error, 'Registration failed'),
          });
          throw error;
        }
      },

      updateProfile: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const user = await updateUserProfile(input);
          set({ user, isLoading: false });
          return user;
        } catch (error) {
          set({
            isLoading: false,
            error: getApiErrorMessage(error, 'Failed to update profile'),
          });
          throw error;
        }
      },

      setOAuthTokens: async (accessToken, refreshToken) => {
        authApi.setOAuthTokens({ accessToken, refreshToken, expiresIn: 900 });
        const user = await authApi.fetchMe();
        set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        }
      },

      fetchUser: async () => {
        const hasToken = !!Cookies.get(TOKEN_KEYS.access);
        if (!hasToken) {
          set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authApi.fetchMe();
          set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'gathera-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state && !Cookies.get(TOKEN_KEYS.access)) {
          state.user = null;
          state.isAuthenticated = false;
        }
      },
    },
  ),
);
