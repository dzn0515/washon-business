import type {

  BusinessAdProductState,

  BusinessAdSummary,

} from '@/lib/ad-applications/types'

import {

  EXPOSURE_PRODUCT_IDS,

  isExposureProductId,

} from '@/lib/billing/ad-product-selection'

import {

  formatDefaultExposureLabel,

  getAdProduct,

  LEGACY_EXPOSURE_PRODUCT_IDS,

} from '@/lib/billing/catalog'

import type { AdProduct } from '@/lib/billing/catalog'



const INITIAL_STATES: BusinessAdProductState[] = [

  { productId: 'exposure-1km', displayStatus: 'pending' },

  { productId: 'exposure-1_5km', displayStatus: 'available' },

  { productId: 'exposure-3km', displayStatus: 'available' },

  { productId: 'exposure-10km-premium', displayStatus: 'available' },

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



function isLegacyExposureId(productId: string): boolean {

  return (LEGACY_EXPOSURE_PRODUCT_IDS as readonly string[]).includes(productId)

}



function formatExposureRange(states: BusinessAdProductState[]): string {

  const defaultLabel = formatDefaultExposureLabel()



  const activeExposure =

    [...EXPOSURE_PRODUCT_IDS]

      .reverse()

      .find((id) => states.find((s) => s.productId === id)?.displayStatus === 'active') ??

    LEGACY_EXPOSURE_PRODUCT_IDS.find(

      (id) => states.find((s) => s.productId === id)?.displayStatus === 'active',

    ) ??

    null



  if (activeExposure) {

    return getAdProduct(activeExposure)?.name ?? '노출 이용중'

  }



  const pending = states.find(

    (s) =>

      (isExposureProductId(s.productId) || isLegacyExposureId(s.productId)) &&

      s.displayStatus === 'pending',

  )

  if (pending) {

    const p = getAdProduct(pending.productId)

    return p ? `${p.name} 신청 대기` : defaultLabel

  }

  return defaultLabel

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


