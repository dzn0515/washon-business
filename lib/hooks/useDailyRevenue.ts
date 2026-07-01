'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchDailyRevenue, type ApiDailyRevenue } from '@/lib/revenue-api'
import { todayIso } from '@/lib/api-mappers'

export function useDailyRevenue(initialDate?: string) {
  const [selectedDate, setSelectedDate] = useState(initialDate ?? todayIso())
  const [data, setData] = useState<ApiDailyRevenue | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)

  const refetch = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const result = await fetchDailyRevenue(date)
      setData(result)
      setIsLive(true)
    } catch {
      setData(null)
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch(selectedDate)
  }, [selectedDate, refetch])

  return { data, loading, isLive, selectedDate, setSelectedDate, refetch }
}
