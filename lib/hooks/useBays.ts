'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { mockBays } from '@/lib/mock/data'
import type { BusinessBay } from '@/types'

type ApiBay = {
  id: string
  business_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

function mapBay(row: ApiBay): BusinessBay {
  return {
    id: row.id,
    name: row.name,
    sort_order: row.sort_order,
    is_active: row.is_active,
  }
}

export function useBays() {
  const [bays, setBays] = useState<BusinessBay[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await apiFetch<ApiBay[]>('/business/bays/')
      setBays(rows.map(mapBay))
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.log('[useBays] API failed, using mock fallback', message)
      setError(message)
      setBays(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return {
    bays: bays ?? mockBays,
    loading,
    error,
    isLive: bays !== null,
    refetch: load,
  }
}
