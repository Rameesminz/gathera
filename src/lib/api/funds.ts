import { api } from '@/lib/api/client';
import type { ApiSuccessResponse } from '@/types';

export async function fetchFundOverview(clubId: string) {
  const { data } = await api.get<ApiSuccessResponse<{
    fund: { balance: number; currency: string };
    transactions: Array<Record<string, unknown>>;
    donations: Array<Record<string, unknown>>;
    report: Record<string, unknown>;
  }>>(`/funds/clubs/${clubId}/funds`);
  return data.data;
}

export async function createDonation(
  clubId: string,
  input: { amount: number; currency?: string; purpose?: string; note?: string },
) {
  const { data } = await api.post<ApiSuccessResponse<{ donation: Record<string, unknown> }>>(
    `/funds/clubs/${clubId}/donations`,
    input,
  );
  return data.data.donation;
}

export async function createExpense(clubId: string, input: { amount: number; description: string }) {
  const { data } = await api.post<ApiSuccessResponse<{ transactionId: string }>>(
    `/funds/clubs/${clubId}/expenses`,
    input,
  );
  return data.data;
}
