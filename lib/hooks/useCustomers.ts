'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { mapApiGradeFilter, mapCustomerGrade } from '@/lib/api-mappers'
import { mockCustomers, mockCustomerStats } from '@/lib/mock/data'

type ApiCustomer = {
  id: string
  name: string
  phone: string
  vehicle_model: string | null
  visit_count: number
  total_spent: number
  last_visit_date: string | null
  grade: string
  memo: string | null
}

export type CustomerRow = (typeof mockCustomers)[0]

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function useCustomers(gradeFilter?: string) {
  const [customers, setCustomers] = useState<CustomerRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    const apiGrade = gradeFilter ? mapApiGradeFilter(gradeFilter) : undefined
    if (apiGrade) params.set('grade', apiGrade)
    const qs = params.toString()

    apiFetch<ApiCustomer[]>(`/business/crm/customers/${qs ? `?${qs}` : ''}`)
      .then((rows) =>
        setCustomers(
          rows.map((c) => ({
            user_id: hashId(c.id),
            name: c.name,
            phone: c.phone,
            grade: mapCustomerGrade(c.grade),
            visit_count: c.visit_count,
            total_spent: c.total_spent,
            last_visit_at: c.last_visit_date ?? '',
            next_recommended_visit: '',
            car_number: '',
            car_model: c.vehicle_model ?? '',
            memo: c.memo ?? '',
          })),
        ),
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [gradeFilter])

  const displayCustomers = customers ?? mockCustomers

  const stats = useMemo(() => {
    if (!customers) return mockCustomerStats
    const vip = customers.filter((c) => c.grade === 'VIP').length
    const regular = customers.filter((c) => c.grade === 'GOLD' || c.grade === 'VIP' || c.visit_count >= 10).length
    const newCount = customers.filter((c) => c.visit_count <= 3).length
    return {
      total: customers.length,
      new: newCount,
      regular,
      regular_pct: customers.length ? Math.round((regular / customers.length) * 100) : 0,
      vip,
    }
  }, [customers])

  return { customers: displayCustomers, stats, loading, error, isLive: customers !== null }
}
