'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchSalesByMenu,
  fetchSalesSummary,
  fetchSalesTimeseries,
  fetchSalesTransactions,
  fetchDailyRevenue,
  type ApiDailyRevenue,
  type ApiSalesByMenu,
  type ApiSalesSummary,
  type ApiSalesTimeseriesPoint,
  type ApiSalesTransaction,
} from '@/lib/revenue-api'
import { todayIso } from '@/lib/api-mappers'

export type RevenuePeriodKey = 'today' | '7d' | 'month' | 'last_month' | 'custom'

function toIso(d: Date) {
  return d.toISOString().slice(0, 10)
}

function periodRange(key: RevenuePeriodKey, customFrom?: string, customTo?: string) {
  const today = new Date()
  const t = todayIso()
  if (key === 'today') return { from: t, to: t, interval: 'day' as const }
  if (key === '7d') {
    const from = new Date(today)
    from.setDate(from.getDate() - 6)
    return { from: toIso(from), to: t, interval: 'day' as const }
  }
  if (key === 'last_month') {
    const firstThis = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastPrev = new Date(firstThis)
    lastPrev.setDate(0)
    const firstPrev = new Date(lastPrev.getFullYear(), lastPrev.getMonth(), 1)
    return { from: toIso(firstPrev), to: toIso(lastPrev), interval: 'day' as const }
  }
  if (key === 'custom' && customFrom && customTo) {
    return { from: customFrom, to: customTo, interval: 'day' as const }
  }
  // month
  const first = new Date(today.getFullYear(), today.getMonth(), 1)
  return { from: toIso(first), to: t, interval: 'day' as const }
}

export function useRevenueDashboard() {
  const [period, setPeriod] = useState<RevenuePeriodKey>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [summary, setSummary] = useState<ApiSalesSummary | null>(null)
  const [series, setSeries] = useState<ApiSalesTimeseriesPoint[]>([])
  const [byMenu, setByMenu] = useState<ApiSalesByMenu[]>([])
  const [tx, setTx] = useState<ApiSalesTransaction[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [txPage, setTxPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(
    () => periodRange(period, customFrom, customTo),
    [period, customFrom, customTo],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, ts, menu, list] = await Promise.all([
        fetchSalesSummary(range.from, range.to),
        fetchSalesTimeseries(range.from, range.to, range.interval),
        fetchSalesByMenu(range.from, range.to),
        fetchSalesTransactions({
          dateFrom: range.from,
          dateTo: range.to,
          q: q || undefined,
          status: status || undefined,
          page: txPage,
          pageSize: 20,
        }),
      ])
      setSummary(s)
      setSeries(ts.items ?? [])
      setByMenu(menu ?? [])
      setTx(list.items ?? [])
      setTxTotal(list.total ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSummary(null)
      setSeries([])
      setByMenu([])
      setTx([])
      setTxTotal(0)
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to, range.interval, q, status, txPage])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setTxPage(1)
  }, [period, customFrom, customTo, q, status])

  return {
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    range,
    summary,
    series,
    byMenu,
    tx,
    txTotal,
    txPage,
    setTxPage,
    q,
    setQ,
    status,
    setStatus,
    loading,
    error,
    refetch: load,
  }
}

export function useDailyRevenue(initialDate?: string) {
  const [selectedDate, setSelectedDate] = useState(initialDate ?? todayIso())
  const [data, setData] = useState<ApiDailyRevenue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const refetch = useCallback(async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDailyRevenue(date)
      setData(result)
      setIsLive(true)
    } catch (e) {
      setData(null)
      setIsLive(false)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch(selectedDate)
  }, [selectedDate, refetch])

  return { data, loading, error, isLive, selectedDate, setSelectedDate, refetch }
}
