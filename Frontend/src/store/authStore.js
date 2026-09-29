import { create } from 'zustand';
import { loginApi, getMeApi } from '../api/auth';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('taraaang_user') || 'null'),
  token: localStorage.getItem('taraaang_token') || null,
  settings: JSON.parse(localStorage.getItem('taraaang_settings') || 'null'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginApi(email, password);
      const { token, user, settings } = response.data;

      localStorage.setItem('taraaang_token', token);
      localStorage.setItem('taraaang_user', JSON.stringify(user));
      if (settings) {
        localStorage.setItem('taraaang_settings', JSON.stringify(settings));
      }

      set({
        token,
        user,
        settings: settings || get().settings,
        isLoading: false,
        error: null,
      });

      return { success: true, user };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  fetchMe: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await getMeApi();
      const { user, settings } = res.data;
      localStorage.setItem('taraaang_user', JSON.stringify(user));
      if (settings) {
        localStorage.setItem('taraaang_settings', JSON.stringify(settings));
      }
      set({ user, settings });
    } catch {
      get().logout();
    }
  },

  logout: () => {
    localStorage.removeItem('taraaang_token');
    localStorage.removeItem('taraaang_user');
    set({ user: null, token: null, error: null });
  },

  setUser: (user) => {
    localStorage.setItem('taraaang_user', JSON.stringify(user));
    set({ user });
  },

  setSettings: (settings) => {
    localStorage.setItem('taraaang_settings', JSON.stringify(settings));
    set({ settings });
  },
}));
