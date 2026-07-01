'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { mapCustomerGrade } from '@/lib/api-mappers'
import { fetchCustomer, fetchCustomers, updateCustomer, type ApiCustomerDetail } from '@/lib/customers-api'
import { mockCustomers, mockCustomerStats } from '@/lib/mock/data'
import type { CustomerGrade } from '@/types'

export type CustomerRow = {
  id: string
  name: string
  phone: string
  grade: CustomerGrade
  visit_count: number
  total_spent: number
  last_visit_at: string
  car_model: string
  memo: string
}

function mapRow(c: {
  id: string
  name: string
  phone: string
  vehicle_model: string | null
  visit_count: number
  total_spent: number
  last_visit_at: string | null
  memo: string | null
}): CustomerRow {
  const visitCount = c.visit_count
  let grade = mapCustomerGrade(visitCount >= 10 ? 'vip' : visitCount >= 3 ? 'regular' : 'new')
  if (visitCount === 0) grade = 'NORMAL'
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
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
    car_model: c.vehicle_model ?? '-',
    memo: c.memo ?? '',
  }
}

export function useCustomers(searchQuery?: string) {
  const [customers, setCustomers] = useState<CustomerRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchCustomers(searchQuery)
      setCustomers(rows.map(mapRow))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setCustomers(null)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    void load()
  }, [load])

  const displayCustomers: CustomerRow[] =
    customers ??
    mockCustomers.map((m) => ({
      id: String(m.user_id),
      name: m.name,
      phone: m.phone,
      grade: m.grade as CustomerGrade,
      visit_count: m.visit_count,
      total_spent: m.total_spent,
      last_visit_at: m.last_visit_at,
      car_model: m.car_model,
      memo: m.memo,
    }))

  const stats = useMemo(() => {
    if (!customers) return mockCustomerStats
    const vip = customers.filter((c) => c.grade === 'VIP').length
    const regular = customers.filter((c) => c.visit_count >= 3).length
    const newCount = customers.filter((c) => c.visit_count === 0).length
    return {
      total: customers.length,
      new: newCount,
      regular,
      regular_pct: customers.length ? Math.round((regular / customers.length) * 100) : 0,
      vip,
    }
  }, [customers])

  return { customers: displayCustomers, stats, loading, error, isLive: customers !== null, refetch: load }
}

export function useCustomerDetail(customerId: string | undefined) {
  const [detail, setDetail] = useState<ApiCustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)

  const load = useCallback(async () => {
    if (!customerId) return
    setLoading(true)
    try {
      const data = await fetchCustomer(customerId)
      setDetail(data)
      setIsLive(true)
    } catch {
      setDetail(null)
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(
    async (payload: { name?: string; phone?: string; memo?: string | null }) => {
      if (!customerId || !isLive) return false
      try {
        await updateCustomer(customerId, payload)
        await load()
        return true
      } catch {
        return false
      }
    },
    [customerId, isLive, load],
  )

  return { detail, loading, isLive, refetch: load, save }
}
