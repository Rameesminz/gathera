import { api } from '@/lib/api/client';
import type { ApiSuccessResponse } from '@/types';

export async function fetchWsTicket(): Promise<string | null> {
  try {
    const { data } = await api.post<ApiSuccessResponse<{ ticket: string; expiresIn: number }>>(
      '/auth/ws-ticket',
    );
    return data.data.ticket;
  } catch {
    return null;
  }
}
