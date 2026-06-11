import apiClient from './apiClient';
import type { ApiResponse } from '@/types/api';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  channel: string;
  is_read: boolean;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
}

interface PaginatedNotifications {
  data: AppNotification[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * GET /api/v1/me/notifications
 */
export async function getNotifications(page = 1): Promise<PaginatedNotifications> {
  const { data } = await apiClient.get<ApiResponse<PaginatedNotifications>>(
    '/me/notifications',
    { params: { page } },
  );
  return data.data;
}

/**
 * GET /api/v1/me/notifications/unread-count
 */
export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<ApiResponse<{ count: number }>>(
    '/me/notifications/unread-count',
  );
  return data.data.count;
}

/**
 * POST /api/v1/me/notifications/{id}/read
 */
export async function markNotificationRead(id: number): Promise<AppNotification> {
  const { data } = await apiClient.post<ApiResponse<AppNotification>>(
    `/me/notifications/${id}/read`,
  );
  return data.data;
}

/**
 * POST /api/v1/me/notifications/read-all
 */
export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/me/notifications/read-all');
}

/**
 * DELETE /api/v1/me/notifications/{id}
 */
export async function deleteNotification(id: number): Promise<void> {
  await apiClient.delete(`/me/notifications/${id}`);
}

/**
 * DELETE /api/v1/me/notifications
 */
export async function deleteAllNotifications(): Promise<void> {
  await apiClient.delete('/me/notifications');
}
