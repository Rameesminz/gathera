import { api } from '@/lib/api/client';
import type { ApiSuccessResponse, Event } from '@/types';

export async function fetchEvents(clubId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ events: Event[] }>>(
    `/events/clubs/${clubId}/events`,
  );
  return data.data.events;
}

export async function createEvent(
  clubId: string,
  input: {
    title: string;
    description?: string;
    location?: string;
    startAt: string;
    endAt?: string;
  },
) {
  const { data } = await api.post<ApiSuccessResponse<{ event: Event }>>(
    `/events/clubs/${clubId}/events`,
    input,
  );
  return data.data.event;
}

export async function rsvpEvent(eventId: string, status: 'going' | 'maybe' | 'not_going') {
  const { data } = await api.post<ApiSuccessResponse<{ event: Event }>>(
    `/events/${eventId}/rsvp`,
    { status },
  );
  return data.data.event;
}
