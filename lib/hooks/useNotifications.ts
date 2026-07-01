'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification,
} from '@/lib/notifications-api'

export function useNotifications() {
  const [items, setItems] = useState<ApiNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setItems(data.items)
      setUnreadCount(data.unread_count)
      setIsLive(true)
    } catch {
      setItems([])
      setUnreadCount(0)
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const markRead = useCallback(
    async (id: string) => {
      if (!isLive) return
      try {
        await markNotificationRead(id)
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        setUnreadCount((c) => Math.max(c - 1, 0))
      } catch {
        // ignore
      }
    },
    [isLive],
  )

  const markAllRead = useCallback(async () => {
    if (!isLive) return
    try {
      await markAllNotificationsRead()
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }, [isLive])

  return {
    notifications: items,
    unreadCount,
    loading,
    isLive,
    refetch: load,
    markRead,
    markAllRead,
  }
}
