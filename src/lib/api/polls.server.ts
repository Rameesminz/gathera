import type { ApiSuccessResponse, Poll } from '@/types';
import { getServerApiClient } from '@/lib/api/server-client';

export async function fetchPollsServer(clubId: string) {
  const api = await getServerApiClient();
  const { data } = await api.get<ApiSuccessResponse<{ polls: Poll[] }>>(
    `/polls/clubs/${clubId}/polls`,
  );
  return data.data.polls;
}
