'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { mockStaffMembers } from '@/lib/mock/data'
import type { BusinessStaff } from '@/types'

type ApiStaff = {
  id: string
  business_id: string
  name: string
  phone: string | null
  position: string | null
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

function mapStaff(row: ApiStaff): BusinessStaff {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? '',
    position: row.position ?? '',
    color: row.color,
    sort_order: row.sort_order,
    is_active: row.is_active,
  }
}

export function useStaff() {
  const [staff, setStaff] = useState<BusinessStaff[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await apiFetch<ApiStaff[]>('/business/staff/')
      setStaff(rows.map(mapStaff))
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.log('[useStaff] API failed, using mock fallback', message)
      setError(message)
      setStaff(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return {
    staff: staff ?? mockStaffMembers,
    loading,
    error,
    isLive: staff !== null,
    refetch: load,
  }
}
