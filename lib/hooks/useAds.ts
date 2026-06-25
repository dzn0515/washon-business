'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { mockAds } from '@/lib/mock/data'

type ApiAdsSummary = {
  monthly_exposure: number
  clicks: number
  booking_conversions: number
  exposure_radius_km: number
  conversion_rate: number
  app_maintenance_fee: number
}

export function useAds() {
  const [ads, setAds] = useState<typeof mockAds | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<ApiAdsSummary>('/business/ads/')
      .then((api) =>
        setAds({
          monthly_exposure: api.monthly_exposure,
          clicks: api.clicks,
          booking_conversions: api.booking_conversions,
          radius_km: api.exposure_radius_km,
          conversion_rate: api.conversion_rate,
          app_maintenance_fee: api.app_maintenance_fee,
        }),
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { ads: ads ?? mockAds, loading, error, isLive: ads !== null }
}
