import type { BusinessAdProductState, BusinessAdSummary } from '@/lib/ad-applications/types'

/** 클린카워시 강남점(mockBusiness) 기준 사장님 앱 노출 상품 상태 */
export const mockBusinessAdSummary: BusinessAdSummary = {
  exposureRange: '기본 반경 5km',
  activeAdCount: 1,
  pendingCount: 1,
  automationStatus: '재방문 알림 이용중',
}

export const mockBusinessAdProductStates: BusinessAdProductState[] = [
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

export function getBusinessProductState(productId: string): BusinessAdProductState | undefined {
  return mockBusinessAdProductStates.find((s) => s.productId === productId)
}
