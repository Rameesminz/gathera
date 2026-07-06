import { api } from '@/lib/api/client';
import type { ApiSuccessResponse, Notification } from '@/types';

export async function fetchNotifications() {
  const { data } = await api.get<ApiSuccessResponse<{ notifications: Notification[] }>>('/notifications');
  return data.data.notifications;
}

export async function fetchUnreadCount() {
  const { data } = await api.get<ApiSuccessResponse<{ count: number }>>('/notifications/unread-count');
  return data.data.count;
}

export async function markNotificationRead(notificationId: string) {
  await api.patch(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all');
}
