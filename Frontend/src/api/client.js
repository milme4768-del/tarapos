import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taraaang_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error normalization
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('taraaang_token');
      localStorage.removeItem('taraaang_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred. Please check your connection.';

    return Promise.reject(new Error(message));
  }
);

export default api;
