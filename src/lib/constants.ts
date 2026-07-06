export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8788/api/v1';

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? API_BASE_URL.replace(/^http/, 'ws');

export const TOKEN_KEYS = {
  access: 'gathera_access_token',
  refresh: 'gathera_refresh_token',
} as const;
