'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  fetchCoupons,
  fetchCustomerCoupons,
  issueCustomerCoupon,
  markCustomerCouponUsed,
  type ApiCoupon,
  type ApiCustomerCoupon,
  type CouponPayload,
} from '@/lib/coupons-api'
import { mockCoupons } from '@/lib/mock/data'

function mockToApiCoupon(c: (typeof mockCoupons)[number]): ApiCoupon {
  return {
    id: String(c.id),
    business_id: 'mock',
    name: c.name,
    discount_type: c.discount_type === 'FIXED' ? 'amount' : 'percent',
    discount_value: c.discount_value,
    min_order_amount: c.min_price,
    valid_from: c.valid_from,
    valid_until: c.valid_until,
    is_active: c.is_active,
    created_at: new Date().toISOString(),
  }
}

const MOCK_COUPONS: ApiCoupon[] = mockCoupons.map(mockToApiCoupon)

export function useCoupons() {
  const [coupons, setCoupons] = useState<ApiCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchCoupons()
      setCoupons(data)
      setIsLive(true)
    } catch {
      setCoupons(MOCK_COUPONS)
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { coupons, loading, isLive, refetch }
}

export function useCustomerCoupons(customerId: string | undefined) {
  const [items, setItems] = useState<ApiCustomerCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)

  const refetch = useCallback(async () => {
    if (!customerId) return
    setLoading(true)
    try {
      const data = await fetchCustomerCoupons(customerId)
      setItems(data)
      setIsLive(true)
    } catch {
      setItems([])
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const issue = useCallback(
    async (couponId: string) => {
      if (!customerId) return false
      try {
        await issueCustomerCoupon(customerId, couponId)
        await refetch()
        return true
      } catch {
        return false
      }
    },
    [customerId, refetch],
  )

  const markUsed = useCallback(
    async (customerCouponId: string) => {
      try {
        await markCustomerCouponUsed(customerCouponId)
        await refetch()
        return true
      } catch {
        return false
      }
    },
    [refetch],
  )

  return { items, loading, isLive, refetch, issue, markUsed }
}

export type { ApiCoupon, ApiCustomerCoupon, CouponPayload }
