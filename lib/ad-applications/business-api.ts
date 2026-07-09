import { apiFetch } from '@/lib/api-client'
import type {
  BusinessAdProductState,
  BusinessAdSummary,
} from '@/lib/ad-applications/types'
import {
  EXPOSURE_PRODUCT_IDS,
  isExposureProductId,
} from '@/lib/billing/ad-product-selection'
import { getAdProduct } from '@/lib/billing/catalog'

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
