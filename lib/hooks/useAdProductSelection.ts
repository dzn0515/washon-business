'use client'

import { useCallback, useMemo, useState } from 'react'
import type { BusinessProductDisplayStatus } from '@/lib/ad-applications/types'
import {
  hasPendingExposureLowerThan,
  splitPaymentTotals,
  toggleAdSelection,
  toggleAutomationSelection,
  toggleExposureSelection,
} from '@/lib/billing/ad-product-selection'
import {
  EXPOSURE_PRODUCTS,
  getAdProduct,
  type AdProduct,
} from '@/lib/billing/catalog'

type UseAdProductSelectionOptions = {
  getDisplayStatus: (productId: string) => BusinessProductDisplayStatus
  disabled?: boolean
}

export function useAdProductSelection({
  getDisplayStatus,
  disabled = false,
}: UseAdProductSelectionOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exposureNotice, setExposureNotice] = useState<string | null>(null)

  const pendingExposureIds = useMemo(() => {
    const ids: string[] = []
    for (const p of EXPOSURE_PRODUCTS) {
      if (getDisplayStatus(p.id) === 'pending') ids.push(p.id)
    }
    return ids
  }, [getDisplayStatus])

  const toggleProduct = useCallback(
    (productId: string) => {
      if (disabled) return
      const product = getAdProduct(productId)
      if (!product) return
      const status = getDisplayStatus(productId)

      if (product.category === 'exposure') {
        if (status === 'pending') return
        setSelectedIds((prev) => {
          const next = toggleExposureSelection(prev, productId)
          const selectedExposure = Array.from(next).find((id) => id.startsWith('exposure-'))
          if (
            selectedExposure &&
            hasPendingExposureLowerThan(pendingExposureIds, selectedExposure)
          ) {
            setExposureNotice(
              '기존 신청 대기 건은 결제 시 자동 취소됩니다',
            )
          } else {
            setExposureNotice(null)
          }
          return next
        })
        return
      }

      if (product.category === 'ad') {
        if (status === 'active') return
        if (status !== 'available' && status !== 'ended') return
        setSelectedIds((prev) => toggleAdSelection(prev, productId))
        return
      }

      if (product.category === 'automation') {
        if (status === 'active') return
        if (status !== 'available' && status !== 'ended') return
        setSelectedIds((prev) => toggleAutomationSelection(prev, productId))
      }
    },
    [disabled, getDisplayStatus, pendingExposureIds],
  )

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setExposureNotice(null)
  }, [])

  const selectedProducts = useMemo(
    () =>
      Array.from(selectedIds)
        .map((id) => getAdProduct(id))
        .filter((p): p is AdProduct => p !== undefined),
    [selectedIds],
  )

  const paymentTotals = useMemo(
    () => splitPaymentTotals(selectedProducts),
    [selectedProducts],
  )

  const isProductDisabled = useCallback(
    (product: AdProduct): boolean => {
      if (disabled) return true
      const status = getDisplayStatus(product.id)
      if (product.category === 'exposure') return status === 'pending'
      if (product.category === 'ad') return status === 'active' || status === 'pending'
      if (product.category === 'automation') return status === 'active' || status === 'pending'
      return status !== 'available' && status !== 'ended'
    },
    [disabled, getDisplayStatus],
  )

  const isProductSelected = useCallback(
    (productId: string) => selectedIds.has(productId),
    [selectedIds],
  )

  return {
    selectedIds,
    selectedProducts,
    paymentTotals,
    exposureNotice,
    toggleProduct,
    clearSelection,
    isProductDisabled,
    isProductSelected,
  }
}
