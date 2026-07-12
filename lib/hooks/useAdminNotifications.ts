'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchAdminNotifications,
  fetchAdminNotificationsUnreadCount,
  markAllAdminNotificationsRead,
  markAdminNotificationRead,
  type AdminNotificationItem,
} from '@/lib/admin-api'

const POLL_MS = 30_000

export function useAdminNotifications() {
  const [items, setItems] = useState<AdminNotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)
  const inFlightRef = useRef(false)
  const mountedRef = useRef(true)

  const loadList = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    try {
      const data = await fetchAdminNotifications({ page: 1, pageSize: 50 })
      if (!mountedRef.current) return
      setItems(data.items)
      setUnreadCount(data.unreadCount)
      setIsLive(true)
      setError(null)
    } catch (e) {
      if (!mountedRef.current) return
      // Keep previous count/items on error so the header badge does not flash to 0.
      setIsLive(false)
      setError(e instanceof Error ? e.message : '알림을 불러오지 못했습니다.')
    } finally {
      inFlightRef.current = false
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  const loadUnreadOnly = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return
    }
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      const count = await fetchAdminNotificationsUnreadCount()
      if (!mountedRef.current) return
      setUnreadCount(count)
      setIsLive(true)
      setError(null)
    } catch {
      if (mountedRef.current) setIsLive(false)
    } finally {
      inFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    void loadList()
    return () => {
      mountedRef.current = false
    }
  }, [loadList])

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadUnreadOnly()
    }, POLL_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadUnreadOnly()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [loadUnreadOnly])

  const markRead = useCallback(async (id: string) => {
    let shouldDecrement = false
    setItems((prev) => {
      const found = prev.find((n) => n.id === id)
      if (!found || found.isRead) return prev
      shouldDecrement = true
      return prev.map((n) =>
        n.id === id
          ? { ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() }
          : n,
      )
    })
    if (shouldDecrement) {
      setUnreadCount((c) => Math.max(c - 1, 0))
    }
    try {
      const item = await markAdminNotificationRead(id)
      if (!mountedRef.current) return item
      setItems((prev) => prev.map((n) => (n.id === id ? item : n)))
      try {
        const count = await fetchAdminNotificationsUnreadCount()
        if (mountedRef.current) setUnreadCount(count)
      } catch {
        /* keep optimistic count */
      }
      return item
    } catch {
      void loadUnreadOnly()
      return null
    }
  }, [loadUnreadOnly])

  const markAllRead = useCallback(async () => {
    try {
      const result = await markAllAdminNotificationsRead()
      if (!mountedRef.current) return
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
      )
      setUnreadCount(result.unreadCount)
    } catch {
      // ignore
    }
  }, [])

  return {
    notifications: items,
    unreadCount,
    loading,
    error,
    isLive,
    refetch: loadList,
    refreshUnread: loadUnreadOnly,
    markRead,
    markAllRead,
  }
}
