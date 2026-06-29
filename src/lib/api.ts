import axios from 'axios';

// API base. In dev this stays '/api' (proxied to the backend by Vite). In
// production set VITE_API_URL to the deployed backend, e.g.
// https://talent-sphere-backend-production.up.railway.app/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Origin of the backend (without the trailing /api) — used to resolve
// server-relative asset paths like "/uploads/file.pdf".
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

/** Resolve a (possibly server-relative) asset URL against the backend origin. */
export function assetUrl(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'ts_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      tokenStore.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function apiError(err: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || fallback;
  }
  return fallback;
}

/** Returns a server-provided validation error list (e.g. submit gating), if any. */
export function apiErrors(err: unknown): string[] {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (Array.isArray(data?.errors)) return data.errors as string[];
  }
  return [];
}
