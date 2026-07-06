import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL, TOKEN_KEYS } from '@/lib/constants';
import type { ApiErrorResponse, ApiSuccessResponse, AuthTokens } from '@/types';

let refreshPromise: Promise<string | null> | null = null;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get(TOKEN_KEYS.access);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = Cookies.get(TOKEN_KEYS.refresh);
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<ApiSuccessResponse<{ tokens: AuthTokens }>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    const tokens = data.data.tokens;
    Cookies.set(TOKEN_KEYS.access, tokens.accessToken, { expires: 1 });
    Cookies.set(TOKEN_KEYS.refresh, tokens.refreshToken, { expires: 7 });
    return tokens.accessToken;
  } catch {
    Cookies.remove(TOKEN_KEYS.access);
    Cookies.remove(TOKEN_KEYS.refresh);
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config;
    if (!original || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) return Promise.reject(error);

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);

export function setAuthTokens(tokens: AuthTokens) {
  const opts = { expires: 7, sameSite: 'lax' as const, path: '/' };
  Cookies.set(TOKEN_KEYS.access, tokens.accessToken, { ...opts, expires: 1 });
  Cookies.set(TOKEN_KEYS.refresh, tokens.refreshToken, opts);
}

export function clearAuthTokens() {
  Cookies.remove(TOKEN_KEYS.access);
  Cookies.remove(TOKEN_KEYS.refresh);
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocal) {
        return 'Cannot reach the API server. Make sure the backend is running (npm run dev on port 8788).';
      }
      return `Cannot reach the API server at ${API_BASE_URL}. Check that the API is deployed and CORS is configured.`;
    }
    return error.response?.data?.error?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
