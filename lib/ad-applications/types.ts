import type { AdBillingType } from '@/lib/billing/catalog'

export type AdApplicationStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'ENDED'

export type AdApplicationProductType = 'exposure' | 'ad' | 'automation'

export type AdApplicationStatusHistory = {
  id: string
  status: AdApplicationStatus
  changedAt: string
  note: string
  by: 'admin' | 'system'
}

export type AdminAdApplication = {
  id: string
  businessId: string
  businessName: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  productId: string
  productName: string
  productType: AdApplicationProductType
  billingType: AdBillingType
  amount: number
  appliedAt: string
  status: AdApplicationStatus
  startDate: string | null
  endDate: string | null
  applicationMemo: string
  adminMemo: string
  rejectReason?: string
  statusHistory: AdApplicationStatusHistory[]
}

/** 사장님 화면 상품 카드 표시 상태 */
export type BusinessProductDisplayStatus =
  | 'available'
  | 'pending'
  | 'approved'
  | 'active'
  | 'ended'

export type BusinessAdProductState = {
  productId: string
  displayStatus: BusinessProductDisplayStatus
  startDate?: string | null
  endDate?: string | null
}

export type BusinessAdSummary = {
  exposureRange: string
  activeAdCount: number
  pendingCount: number
  automationStatus: string
}

export const AD_APPLICATION_STATUS_LABEL: Record<AdApplicationStatus, string> = {
  PENDING_REVIEW: '신청대기',
  APPROVED: '승인',
  REJECTED: '반려',
  ACTIVE: '진행중',
  ENDED: '종료',
}

export const AD_APPLICATION_PRODUCT_TYPE_LABEL: Record<AdApplicationProductType, string> = {
  exposure: '노출확장',
  ad: '광고상품',
  automation: '자동화',
}

export const BUSINESS_PRODUCT_STATUS_LABEL: Record<BusinessProductDisplayStatus, string> = {
  available: '신청 가능',
  pending: '신청 대기',
  approved: '승인',
  active: '진행중',
  ended: '종료',
}
