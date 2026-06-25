'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { mockNotifications } from '@/lib/mock/data'

type ApiNotification = {
  id: string
  title: string
  body: string
  type: string
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<typeof mockNotifications | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<ApiNotification[]>('/business/notifications/')
      .then((rows) =>
        setNotifications(
          rows.slice(0, 10).map((n, i) => ({
            id: i + 1,
            message: n.title || n.body,
            time: new Date(n.created_at).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            type: n.type.includes('booking') ? 'BOOKING' : n.type === 'settlement' ? 'SETTLEMENT' : 'REVIEW',
          })),
        ),
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { notifications: notifications ?? mockNotifications, loading, error, isLive: notifications !== null }
}
