import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for admin/chef Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('scan_dine_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token expired on admin/chef routes, clear and redirect to login
      const path = window.location.pathname;
      if (path.startsWith('/admin') && path !== '/admin/login') {
        localStorage.removeItem('scan_dine_auth_token');
        localStorage.removeItem('scan_dine_auth_user');
        window.location.href = '/admin/login';
      } else if (path.startsWith('/chef') && path !== '/chef/login') {
        localStorage.removeItem('scan_dine_auth_token');
        localStorage.removeItem('scan_dine_auth_user');
        window.location.href = '/chef/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
