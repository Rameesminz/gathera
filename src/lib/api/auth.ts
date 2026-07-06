import { API_BASE_URL } from '@/lib/constants';
import { api, clearAuthTokens, setAuthTokens } from '@/lib/api/client';
import { TOKEN_KEYS } from '@/lib/constants';
import type { ApiSuccessResponse, AuthTokens, PublicUser } from '@/types';
import Cookies from 'js-cookie';

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const { data } = await api.post<
    ApiSuccessResponse<{ user: PublicUser; tokens: AuthTokens }>
  >('/auth/register', input);
  setAuthTokens(data.data.tokens);
  return data.data;
}

export async function login(input: { email: string; password: string }) {
  const { data } = await api.post<
    ApiSuccessResponse<{ user: PublicUser; tokens: AuthTokens }>
  >('/auth/login', input);
  setAuthTokens(data.data.tokens);
  return data.data;
}

export async function logout() {
  const refreshToken = Cookies.get(TOKEN_KEYS.refresh);
  try {
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } finally {
    clearAuthTokens();
  }
}

export async function fetchMe() {
  const { data } = await api.get<ApiSuccessResponse<{ user: PublicUser }>>('/users/me');
  return data.data.user;
}

export function getGoogleAuthUrl() {
  return `${API_BASE_URL}/auth/google`;
}

export function setOAuthTokens(tokens: AuthTokens) {
  setAuthTokens(tokens);
}
