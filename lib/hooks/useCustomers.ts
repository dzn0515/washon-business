'use client'

import { useCallback, useEffect, useState } from 'react'
import { mapCustomerGrade } from '@/lib/api-mappers'
import {
  fetchCustomer,
  fetchCustomerSummary,
  fetchCustomers,
  type ApiCustomerDetail,
  type ApiCustomerSummary,
} from '@/lib/customers-api'
import type { CustomerGrade } from '@/types'

export type CustomerRow = {
  id: string
  name: string
  phone: string
  grade: CustomerGrade
  visit_count: number
  total_spent: number
  last_visit_at: string
  next_reservation_at: string
  car_model: string
  coupon_count: number
  memo: string
}

function mapRow(c: {
  id: string
  name: string | null
  phone: string | null
  vehicle_model: string | null
  visit_count: number
  total_spent: number
  last_visit_at: string | null
  nextReservationAt?: string | null
  couponCount?: number
  memo: string | null
}): CustomerRow {
  const visitCount = c.visit_count
  let grade = mapCustomerGrade(visitCount >= 10 ? 'vip' : visitCount >= 3 ? 'regular' : 'new')
  if (visitCount === 0) grade = 'NORMAL'
  return {
    id: c.id,
    name: c.name ?? '(이름 없음)',
    phone: c.phone ?? '-',
    grade,
    visit_count: c.visit_count,
    total_spent: c.total_spent,
    last_visit_at: c.last_visit_at
      ? new Date(c.last_visit_at).toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-',
    next_reservation_at: c.nextReservationAt
      ? new Date(c.nextReservationAt).toLocaleString('ko-KR', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-',
    car_model: c.vehicle_model ?? '-',
    coupon_count: c.couponCount ?? 0,
    memo: c.memo ?? '',
  }
}

const EMPTY_SUMMARY: ApiCustomerSummary = {
  totalCustomers: 0,
  newCustomersThisMonth: 0,
  returningCustomers: 0,
  dormantCustomers: 0,
  averageSpend: 0,
  repeatRate: 0,
  total: 0,
  new: 0,
  regular: 0,
  regular_pct: 0,
  vip: 0,
}

export function useCustomers(searchQuery?: string) {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [summary, setSummary] = useState<ApiCustomerSummary>(EMPTY_SUMMARY)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, sum] = await Promise.all([
        fetchCustomers({ q: searchQuery, page, pageSize, sort: 'last_visit' }),
        fetchCustomerSummary(),
      ])
      setCustomers(list.items.map(mapRow))
      setTotal(list.total)
      setSummary(sum)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setCustomers([])
      setTotal(0)
      setSummary(EMPTY_SUMMARY)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  return {
    customers,
    stats: summary,
    total,
    page,
    pageSize,
    setPage,
    loading,
    error,
    isLive: !error && !loading,
    refetch: load,
  }
}

export function useCustomerDetail(customerId: string | undefined) {
  const [detail, setDetail] = useState<ApiCustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const load = useCallback(async () => {
    if (!customerId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCustomer(customerId)
      setDetail(data)
      setIsLive(true)
    } catch (e) {
      setDetail(null)
      setIsLive(false)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    void load()
  }, [load])

  return { detail, loading, error, isLive, refetch: load }
}
