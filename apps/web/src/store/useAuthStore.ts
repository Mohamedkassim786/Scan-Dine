import { create } from 'zustand';
import api from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string, roleCheck?: 'admin' | 'chef') => Promise<User>;
  logout: () => void;
  loadStoredAuth: () => void;
  setAuth: (user: User, token?: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string, roleCheck?: 'admin' | 'chef') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      if (roleCheck && user.role !== roleCheck && user.role !== 'admin') {
        throw new Error(`Unauthorized. This login is reserved for ${roleCheck}s.`);
      }

      localStorage.setItem('scan_dine_auth_token', token);
      localStorage.setItem('scan_dine_auth_user', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return user;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  setAuth: (user: User, token?: string) => {
    const currentToken = token || get().token || localStorage.getItem('scan_dine_auth_token') || '';
    localStorage.setItem('scan_dine_auth_user', JSON.stringify(user));
    if (token) localStorage.setItem('scan_dine_auth_token', token);
    set({ user, token: currentToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('scan_dine_auth_token');
    localStorage.removeItem('scan_dine_auth_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadStoredAuth: () => {
    const token = localStorage.getItem('scan_dine_auth_token');
    const userStr = localStorage.getItem('scan_dine_auth_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          token,
          user,
          isAuthenticated: true,
        });
      } catch (e) {
        localStorage.removeItem('scan_dine_auth_token');
        localStorage.removeItem('scan_dine_auth_user');
      }
    }
  },
}));
