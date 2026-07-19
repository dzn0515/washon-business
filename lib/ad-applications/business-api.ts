import { apiFetch } from '@/lib/api-client'
import type {
  BusinessAdProductState,
  BusinessAdSummary,
  PremiumEligibility,
} from '@/lib/ad-applications/types'
import {
  EXPOSURE_PRODUCT_IDS,
  isExposureProductId,
} from '@/lib/billing/ad-product-selection'
import {
  DEFAULT_EXPOSURE_RADIUS_METERS,
  formatDefaultExposureLabel,
  getAdProduct,
  LEGACY_EXPOSURE_PRODUCT_IDS,
} from '@/lib/billing/catalog'

export type BusinessAdApplicationRow = {
  id: string
  productId: string
  productName: string
  productType: string
  billingType: string
  amount: number
  status: string
  appliedAt: string
  startDate: string | null
  endDate: string | null
  applicantMemo: string
}

export type AdProductCatalogItem = {
  sku: string
  name: string
  radius_meters: number | null
  monthly_price: number
  vat_excluded: boolean
  purchasable: boolean
  blocked_reason?: string | null
  requires_admin_approval: boolean
  exposure_kind: string | null
  tier?: string | null
  description: string
  benefits?: string[]
}

export type BusinessAdProductsResponse = {
  default_exposure: {
    name: string
    radius_meters: number
    included_in_subscription: boolean
  }
  products: AdProductCatalogItem[]
  other?: AdProductCatalogItem[]
  current_plan?: string | null
  included_exposure_radius_meters?: number | null
  effective_exposure_radius_meters?: number | null
  active_ad_radius_meters?: number | null
  active_ad_product_id?: string | null
  can_use_automation?: boolean | null
  plan_features?: Record<string, unknown> | null
  default_exposure_radius_meters?: number
  regional?: AdProductCatalogItem[]
  premium?: AdProductCatalogItem
}

export type { PremiumEligibility }

function mapApiStatus(status: string): BusinessAdProductState['displayStatus'] | null {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'pending'
    case 'APPROVED':
      return 'approved'
    case 'ACTIVE':
      return 'active'
    case 'ENDED':
      return 'ended'
    default:
      return null
  }
}

export function applicationsToProductStates(
  rows: BusinessAdApplicationRow[],
): BusinessAdProductState[] {
  const byProduct = new Map<string, BusinessAdApplicationRow>()
  for (const row of rows) {
    const display = mapApiStatus(row.status)
    if (!display) continue
    const existing = byProduct.get(row.productId)
    if (!existing || row.appliedAt > existing.appliedAt) {
      byProduct.set(row.productId, row)
    }
  }

  const states: BusinessAdProductState[] = []
  for (const row of Array.from(byProduct.values())) {
    const displayStatus = mapApiStatus(row.status)
    if (!displayStatus) continue
    states.push({
      productId: row.productId,
      displayStatus,
      startDate: row.startDate,
      endDate: row.endDate,
    })
  }
  return states
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
    (s) => s.productId.startsWith('auto-') && s.displayStatus === 'active',
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

export async function fetchBusinessAdApplications(): Promise<BusinessAdApplicationRow[]> {
  const data = await apiFetch<{ items: BusinessAdApplicationRow[] }>('/business/ad-applications')
  return data.items ?? []
}

export async function fetchBusinessAdProducts(): Promise<BusinessAdProductsResponse> {
  return apiFetch<BusinessAdProductsResponse>('/business/ad-products')
}

export async function fetchPremiumEligibility(): Promise<PremiumEligibility> {
  return apiFetch<PremiumEligibility>('/business/ad-products/premium-eligibility')
}

export async function submitBusinessAdApplications(
  productIds: string[],
  applicantMemo = '',
): Promise<BusinessAdApplicationRow[]> {
  const data = await apiFetch<{ items: BusinessAdApplicationRow[] }>('/business/ad-applications', {
    method: 'POST',
    body: JSON.stringify({
      items: productIds.map((product_id) => ({ product_id, applicant_memo: applicantMemo })),
    }),
  })
  return data.items ?? []
}

export function getProductState(
  states: BusinessAdProductState[],
  productId: string,
): BusinessAdProductState | undefined {
  return states.find((s) => s.productId === productId)
}

export function catalogItemToAdProduct(item: AdProductCatalogItem) {
  return {
    id: item.sku,
    category: 'exposure' as const,
    name: item.name,
    description: item.description,
    price: item.monthly_price,
    billingType: 'monthly' as const,
  }
}

export { DEFAULT_EXPOSURE_RADIUS_METERS, formatDefaultExposureLabel }
