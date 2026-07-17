import { apiFetch } from '@/lib/api-client'

export type ApiNotification = {
  id: string
  business_id: string | null
  booking_id: string | null
  target_type: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  link_url?: string | null
}

export type NotificationList = {
  items: ApiNotification[]
  unread_count: number
}

export async function fetchNotifications() {
  return apiFetch<NotificationList>('/business/notifications')
}

export async function markNotificationRead(id: string) {
  return apiFetch<ApiNotification>(`/business/notifications/${id}/read`, { method: 'PATCH' })
}

export async function markAllNotificationsRead() {
  return apiFetch<{ updated: number }>('/business/notifications/read-all', { method: 'PATCH' })
}
