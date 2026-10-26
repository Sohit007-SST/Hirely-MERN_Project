import axios from 'axios';

// Session 16: URLs come from Vite env vars so the same build works locally and on Vercel
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, '');

export const TOKEN_KEY = 'token';

// localStorage can throw in some private browsing modes, so reads are guarded
export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const api = axios.create({ baseURL: API_URL });

// Session 7: attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn every failure into one readable error.message for the UI
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    if (error.response) {
      const { data, status } = error.response;
      error.message = data?.message || `Request failed with status ${status}`;
      error.errors = data?.errors; // [{ field, message }] from the validation middleware
      error.status = status;
    } else {
      error.message = 'Cannot reach the server. Check that the API is running';
    }
    return Promise.reject(error);
  }
);

export default api;
