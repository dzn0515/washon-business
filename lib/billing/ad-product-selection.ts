import type { AdProduct } from '@/lib/billing/catalog'

export const EXPOSURE_PRODUCT_IDS = [
  'exposure-10km',
  'exposure-20km',
  'exposure-nation',
] as const

export const AUTOMATION_INDIVIDUAL_IDS = [
  'auto-revisit',
  'auto-birthday',
  'auto-review',
] as const

export const AUTOMATION_BUNDLE_ID = 'auto-bundle'

export function isExposureProductId(id: string): boolean {
  return (EXPOSURE_PRODUCT_IDS as readonly string[]).includes(id)
}

export function isAutomationIndividualId(id: string): boolean {
  return (AUTOMATION_INDIVIDUAL_IDS as readonly string[]).includes(id)
}

export function exposureTierRank(id: string): number {
  return EXPOSURE_PRODUCT_IDS.indexOf(id as (typeof EXPOSURE_PRODUCT_IDS)[number])
}

/** 노출 확장: 단일 선택 토글 (재클릭 시 해제) */
export function toggleExposureSelection(
  prev: Set<string>,
  productId: string,
): Set<string> {
  const next = new Set(prev)
  for (const id of EXPOSURE_PRODUCT_IDS) {
    next.delete(id)
  }
  if (!prev.has(productId)) {
    next.add(productId)
  }
  return next
}

/** 광고: 다중 토글 */
export function toggleAdSelection(prev: Set<string>, productId: string): Set<string> {
  const next = new Set(prev)
  if (next.has(productId)) next.delete(productId)
  else next.add(productId)
  return next
}

/** 자동화: 전체 ↔ 개별 상호 배타 */
export function toggleAutomationSelection(prev: Set<string>, productId: string): Set<string> {
  const next = new Set(prev)
  if (productId === AUTOMATION_BUNDLE_ID) {
    for (const id of AUTOMATION_INDIVIDUAL_IDS) next.delete(id)
    if (prev.has(AUTOMATION_BUNDLE_ID)) next.delete(AUTOMATION_BUNDLE_ID)
    else next.add(AUTOMATION_BUNDLE_ID)
    return next
  }
  next.delete(AUTOMATION_BUNDLE_ID)
  if (next.has(productId)) next.delete(productId)
  else next.add(productId)
  return next
}

export function hasPendingExposureLowerThan(
  pendingProductIds: string[],
  selectedExposureId: string,
): boolean {
  const selectedRank = exposureTierRank(selectedExposureId)
  if (selectedRank < 0) return false
  return pendingProductIds.some((id) => {
    if (!isExposureProductId(id)) return false
    const rank = exposureTierRank(id)
    return rank >= 0 && rank < selectedRank
  })
}

export function splitPaymentTotals(products: AdProduct[]) {
  let monthly = 0
  let oneTime = 0
  for (const p of products) {
    if (p.billingType === 'monthly') monthly += p.price
    else oneTime += p.price
  }
  return { monthly, oneTime, total: monthly + oneTime }
}
