import { api } from '@/lib/api/client';
import type { ApiSuccessResponse } from '@/types';

export async function fetchVapidPublicKey() {
  const { data } = await api.get<ApiSuccessResponse<{ publicKey: string | null }>>(
    '/notifications/vapid-public-key',
  );
  return data.data.publicKey;
}

export async function subscribePush(subscription: PushSubscriptionJSON) {
  await api.post('/notifications/push/subscribe', {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  });
}

export async function unsubscribePush(endpoint: string) {
  await api.delete('/notifications/push/subscribe', { params: { endpoint } });
}

export async function fetchNotificationPrefs() {
  const { data } = await api.get<
    ApiSuccessResponse<{
      preferences: { inApp: boolean; push: boolean; email: boolean; calls: boolean };
    }>
  >('/notifications/preferences');
  return data.data.preferences;
}

export async function updateNotificationPrefs(prefs: {
  inApp?: boolean;
  push?: boolean;
  email?: boolean;
  calls?: boolean;
}) {
  const { data } = await api.patch<
    ApiSuccessResponse<{
      preferences: { inApp: boolean; push: boolean; email: boolean; calls: boolean };
    }>
  >('/notifications/preferences', prefs);
  return data.data.preferences;
}
