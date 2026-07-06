import { api } from '@/lib/api/client';
import type { ApiSuccessResponse, ClubFile, Gallery, GalleryItem, Tournament } from '@/types';

export async function fetchFiles(clubId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ files: ClubFile[] }>>(`/clubs/${clubId}/files`);
  return data.data.files;
}

export async function uploadFile(clubId: string, file: File) {
  const content = await fileToBase64(file);
  const { data } = await api.post<ApiSuccessResponse<{ file: ClubFile }>>(`/clubs/${clubId}/files`, {
    filename: file.name,
    mimeType: file.type,
    content,
  });
  return data.data.file;
}

export async function downloadFile(clubId: string, fileId: string, filename: string) {
  const response = await api.get(`/clubs/${clubId}/files/${fileId}`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function fetchGallery(clubId: string, galleryId: string) {
  const { data } = await api.get<
    ApiSuccessResponse<{ gallery: Gallery; items: GalleryItem[] }>
  >(`/clubs/${clubId}/galleries/${galleryId}`);
  return data.data;
}

export async function addGalleryItem(
  clubId: string,
  galleryId: string,
  input: { fileId: string; caption?: string },
) {
  await api.post(`/clubs/${clubId}/galleries/${galleryId}/items`, input);
}

export async function fetchGalleries(clubId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ galleries: Gallery[] }>>(
    `/clubs/${clubId}/galleries`,
  );
  return data.data.galleries;
}

export async function createGallery(clubId: string, input: { name: string; description?: string }) {
  const { data } = await api.post<ApiSuccessResponse<{ gallery: Gallery }>>(
    `/clubs/${clubId}/galleries`,
    input,
  );
  return data.data.gallery;
}

export async function fetchTournaments(clubId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ tournaments: Tournament[] }>>(
    `/clubs/${clubId}/tournaments`,
  );
  return data.data.tournaments;
}

export async function createTournament(
  clubId: string,
  input: { name: string; description?: string; startAt?: string; maxTeams?: number },
) {
  const { data } = await api.post<ApiSuccessResponse<{ tournament: Tournament }>>(
    `/clubs/${clubId}/tournaments`,
    input,
  );
  return data.data.tournament;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
