import type {
  BusinessAdProductState,
  BusinessAdSummary,
} from '@/lib/ad-applications/types'
import {
  EXPOSURE_PRODUCT_IDS,
  isExposureProductId,
} from '@/lib/billing/ad-product-selection'
import type { AdProduct } from '@/lib/billing/catalog'
import { getAdProduct } from '@/lib/billing/catalog'

const INITIAL_STATES: BusinessAdProductState[] = [
  { productId: 'exposure-10km', displayStatus: 'pending' },
  { productId: 'exposure-20km', displayStatus: 'available' },
  { productId: 'exposure-nation', displayStatus: 'available' },
  {
    productId: 'ad-search-top',
    displayStatus: 'active',
    startDate: '2026-07-01',
    endDate: '2026-07-08',
  },
  { productId: 'ad-main-banner', displayStatus: 'available' },
  { productId: 'ad-push', displayStatus: 'ended', startDate: '2026-05-01', endDate: '2026-05-01' },
  { productId: 'ad-review-boost', displayStatus: 'available' },
  {
    productId: 'auto-revisit',
    displayStatus: 'active',
    startDate: '2026-06-01',
    endDate: '2026-09-01',
  },
  { productId: 'auto-birthday', displayStatus: 'available' },
  { productId: 'auto-review', displayStatus: 'available' },
  { productId: 'auto-bundle', displayStatus: 'available' },
]

let productStates: BusinessAdProductState[] = INITIAL_STATES.map((s) => ({ ...s }))

function cloneStates(): BusinessAdProductState[] {
  return productStates.map((s) => ({ ...s }))
}

export function getBusinessProductStates(): BusinessAdProductState[] {
  return cloneStates()
}

export function getBusinessProductState(productId: string): BusinessAdProductState | undefined {
  return productStates.find((s) => s.productId === productId)
}

function formatExposureRange(states: BusinessAdProductState[]): string {
  const activeExposure = [...EXPOSURE_PRODUCT_IDS]
    .reverse()
    .find((id) => states.find((s) => s.productId === id)?.displayStatus === 'active')
  if (activeExposure === 'exposure-nation') return '전국 노출'
  if (activeExposure === 'exposure-20km') return '반경 20km'
  if (activeExposure === 'exposure-10km') return '반경 10km'
  const pending = states.find(
    (s) => isExposureProductId(s.productId) && s.displayStatus === 'pending',
  )
  if (pending) {
    const p = getAdProduct(pending.productId)
    return p ? `${p.name} 신청 대기` : '기본 반경 5km'
  }
  return '기본 반경 5km'
}

function formatAutomationStatus(states: BusinessAdProductState[]): string {
  const active = states.filter(
    (s) =>
      s.productId.startsWith('auto-') &&
      s.displayStatus === 'active',
  )
  if (active.length === 0) return '미이용'
  if (active.some((s) => s.productId === 'auto-bundle')) return '자동화 전체 이용중'
  const names = active
    .map((s) => getAdProduct(s.productId)?.name)
    .filter(Boolean)
    .join(', ')
  return names ? `${names} 이용중` : '이용중'
}

export function computeBusinessAdSummary(states: BusinessAdProductState[]): BusinessAdSummary {
  const pendingCount = states.filter((s) => s.displayStatus === 'pending').length
  const activeAdCount = states.filter(
    (s) => s.productId.startsWith('ad-') && s.displayStatus === 'active',
  ).length
  return {
    exposureRange: formatExposureRange(states),
    activeAdCount,
    pendingCount,
    automationStatus: formatAutomationStatus(states),
  }
}

export const mockBusinessAdSummary: BusinessAdSummary = computeBusinessAdSummary(INITIAL_STATES)

/** 신청 접수 후 로컬 mock 상태 갱신 (Phase 1 — API 연동 전) */
export function applyBusinessAdProducts(products: AdProduct[]): BusinessAdSummary {
  const next = cloneStates()
  const selectedExposure = products.find((p) => p.category === 'exposure')

  if (selectedExposure) {
    for (const state of next) {
      if (isExposureProductId(state.productId) && state.displayStatus === 'pending') {
        state.displayStatus = 'available'
      }
    }
  }

  for (const product of products) {
    const existing = next.find((s) => s.productId === product.id)
    if (existing) {
      existing.displayStatus = 'pending'
      existing.startDate = null
      existing.endDate = null
    } else {
      next.push({ productId: product.id, displayStatus: 'pending' })
    }
  }

  productStates = next
  return computeBusinessAdSummary(next)
}

/** 테스트/리셋용 */
export function resetBusinessAdProductStates(): void {
  productStates = INITIAL_STATES.map((s) => ({ ...s }))
}
