'use client'

import { useCallback, useEffect, useState } from 'react'
import { isDemoMode } from '@/lib/demo-mode'
import { mockBusiness } from '@/lib/mock/data'
import { resolveResourceLabel } from '@/lib/resource-label'
import { fetchBusinessMe, type BusinessMe } from '@/lib/store-api'

export function useBusinessMe() {
  const isDemo = isDemoMode()
  const [business, setBusiness] = useState<BusinessMe | null>(null)
  const [loading, setLoading] = useState(!isDemo)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (isDemo) {
      setBusiness(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const me = await fetchBusinessMe()
      setBusiness(me)
    } catch (e) {
      setBusiness(null)
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => {
    void load()
  }, [load])

  const display = isDemo
    ? {
        name: mockBusiness.name,
        phone: mockBusiness.phone,
        address: mockBusiness.address,
        slug: mockBusiness.slug,
        bizType: 'wash',
        resourceLabel: '베이',
        bayCount: 3,
        status: 'active' as const,
      }
    : business
      ? {
          name: business.name,
          phone: business.phone ?? '',
          address: business.address,
          slug: business.slug,
          bizType: business.biz_type ?? 'wash',
          resourceLabel: resolveResourceLabel(business.biz_type, business.resource_label),
          bayCount: business.bay_count ?? business.resource_count ?? 1,
          status: business.status,
        }
      : null

  return {
    business,
    display,
    loading,
    error,
    isDemo,
    isLive: !isDemo && business !== null,
    refetch: load,
  }
}
