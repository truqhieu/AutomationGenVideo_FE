import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../lib/api-client';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded));

    if (!payload || typeof payload.exp !== 'number') {
      return true;
    }

    const expiresAtMs = payload.exp * 1000;
    return Date.now() >= expiresAtMs;
  } catch {
    return true;
  }
};

// Ensure local auth storage is cleared when it is no longer valid.
// - In development: always clear on page load so restarting the dev
//   server effectively logs users out.
// - In other envs: clear when token is already expired on the client.
if (typeof window !== 'undefined') {
  try {
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth-storage');
    } else {
      const existingToken = localStorage.getItem('auth_token');
      if (existingToken && isTokenExpired(existingToken)) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth-storage');
      }
    }
  } catch {
    // Ignore storage access errors
  }
}

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

          // Check token expiry on client to avoid showing stale sessions
          if (isTokenExpired(token)) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
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
        // Do not persist isAuthenticated; derive it from a valid token + profile
      }),
    }
  )
);
