import type { ApiSuccessResponse, ClubFile, Gallery, Tournament } from '@/types';
import { getServerApiClient } from '@/lib/api/server-client';

export async function fetchFilesServer(clubId: string) {
  const api = await getServerApiClient();
  const { data } = await api.get<ApiSuccessResponse<{ files: ClubFile[] }>>(
    `/clubs/${clubId}/files`,
  );
  return data.data.files;
}

export async function fetchGalleriesServer(clubId: string) {
  const api = await getServerApiClient();
  const { data } = await api.get<ApiSuccessResponse<{ galleries: Gallery[] }>>(
    `/clubs/${clubId}/galleries`,
  );
  return data.data.galleries;
}

export async function fetchTournamentsServer(clubId: string) {
  const api = await getServerApiClient();
  const { data } = await api.get<ApiSuccessResponse<{ tournaments: Tournament[] }>>(
    `/clubs/${clubId}/tournaments`,
  );
  return data.data.tournaments;
}
