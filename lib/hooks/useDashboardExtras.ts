'use client'

import { useCallback, useEffect, useState } from 'react'
import { todayIso } from '@/lib/api-mappers'
import { fetchCustomerSummary, fetchCustomers, type ApiCustomer } from '@/lib/customers-api'
import { isDemoMode } from '@/lib/demo-mode'
import { fetchSalesTimeseries, type ApiSalesTimeseriesPoint } from '@/lib/revenue-api'

function isoDaysAgo(days: number): string {
  const base = new Date(`${todayIso()}T12:00:00`)
  base.setDate(base.getDate() - days)
  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, '0')
  const d = String(base.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function useDashboardExtras() {
  const isDemo = isDemoMode()
  const [series, setSeries] = useState<ApiSalesTimeseriesPoint[]>([])
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [newCustomersThisMonth, setNewCustomersThisMonth] = useState(0)
  const [salesLoading, setSalesLoading] = useState(!isDemo)
  const [customersLoading, setCustomersLoading] = useState(!isDemo)
  const [salesError, setSalesError] = useState<string | null>(null)
  const [customersError, setCustomersError] = useState<string | null>(null)

  const loadSales = useCallback(async () => {
    if (isDemo) {
      setSeries([])
      setSalesError(null)
      setSalesLoading(false)
      return
    }
    setSalesLoading(true)
    setSalesError(null)
    try {
      const to = todayIso()
      const from = isoDaysAgo(6)
      const res = await fetchSalesTimeseries(from, to, 'day')
      setSeries(res.items ?? [])
    } catch (e) {
      setSeries([])
      setSalesError((e as Error).message || '매출 추이 로드 실패')
    } finally {
      setSalesLoading(false)
    }
  }, [isDemo])

  const loadCustomers = useCallback(async () => {
    if (isDemo) {
      setCustomers([])
      setTotalCustomers(0)
      setNewCustomersThisMonth(0)
      setCustomersError(null)
      setCustomersLoading(false)
      return
    }
    setCustomersLoading(true)
    setCustomersError(null)
    try {
      const [summary, list] = await Promise.all([
        fetchCustomerSummary(),
        fetchCustomers({ page: 1, pageSize: 5, sort: 'last_visit' }),
      ])
      setTotalCustomers(summary.totalCustomers ?? summary.total ?? 0)
      setNewCustomersThisMonth(summary.newCustomersThisMonth ?? summary.new ?? 0)
      setCustomers(list.items ?? [])
    } catch (e) {
      setCustomers([])
      setTotalCustomers(0)
      setNewCustomersThisMonth(0)
      setCustomersError((e as Error).message || '고객 데이터 로드 실패')
    } finally {
      setCustomersLoading(false)
    }
  }, [isDemo])

  useEffect(() => {
    void loadSales()
    void loadCustomers()
  }, [loadSales, loadCustomers])

  return {
    series,
    customers,
    totalCustomers,
    newCustomersThisMonth,
    salesLoading,
    customersLoading,
    salesError,
    customersError,
    refetchSales: loadSales,
    refetchCustomers: loadCustomers,
    isDemo,
  }
}
