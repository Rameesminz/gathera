import type { ApiSuccessResponse, Event } from '@/types';
import { getServerApiClient } from '@/lib/api/server-client';

export async function fetchEventsServer(clubId: string) {
  const api = await getServerApiClient();
  const { data } = await api.get<ApiSuccessResponse<{ events: Event[] }>>(
    `/events/clubs/${clubId}/events`,
  );
  return data.data.events;
}
