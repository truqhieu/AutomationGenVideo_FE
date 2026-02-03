import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../lib/api-client';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });

          console.log('Auth store: Calling login API...');
          const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
          console.log('Auth store: Login API response received', response.data);

          const { access_token, user } = response.data;

          // Save to localStorage
          localStorage.setItem('auth_token', access_token);
          localStorage.setItem('auth_user', JSON.stringify(user));

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });

          console.log('Auth store: Login successful, state updated');
        } catch (error: any) {
          console.error('Auth store: Login failed', error);
          let errorMessage = error.response?.data?.message || 'Login failed';
          if (Array.isArray(errorMessage)) {
            errorMessage = errorMessage.join(', ');
          }
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post<AuthResponse>('/auth/register', data);
          const { access_token, user } = response.data;

          // Save to localStorage
          localStorage.setItem('auth_token', access_token);
          localStorage.setItem('auth_user', JSON.stringify(user));

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          let errorMessage = error.response?.data?.message || 'Registration failed';
          if (Array.isArray(errorMessage)) {
            errorMessage = errorMessage.join(', ');
          }
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      loadUser: async () => {
        try {
          const token = localStorage.getItem('auth_token');

          if (!token) {
            set({ isAuthenticated: false, user: null, token: null });
            return;
          }

          set({ isLoading: true });

          const response = await apiClient.get<User>('/auth/profile');
          const user = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user: User) => {
        set({ user });
        localStorage.setItem('auth_user', JSON.stringify(user));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
