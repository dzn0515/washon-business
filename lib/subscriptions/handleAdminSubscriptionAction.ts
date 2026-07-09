import type { SubscriptionPlanId, SubscriptionStatus } from '@/lib/billing/catalog'
import type { AdminSubscription } from './types'
import {
  terminateAdminSubscription,
  updateAdminSubscriptionPlan,
  updateAdminSubscriptionStatus,
  updateAdminSubscriptionTrial,
  type AdminSubscriptionPlanTier,
} from '@/lib/admin-api'

export type AdminSubscriptionAction =
  | { type: 'change_plan'; planId: SubscriptionPlanId }
  | { type: 'extend_trial'; days: number }
  | { type: 'force_end' }
  | { type: 'change_status'; status: SubscriptionStatus }

export type AdminSubscriptionActionResult = {
  success: boolean
  subscription: AdminSubscription
  message: string
}

const PLAN_ID_TO_TIER: Record<SubscriptionPlanId, AdminSubscriptionPlanTier> = {
  basic: 'BASIC',
  standard: 'STANDARD',
  premium: 'PREMIUM',
}

const TIER_TO_PLAN_ID: Record<string, SubscriptionPlanId> = {
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium',
}

const UI_STATUS_TO_API: Record<SubscriptionStatus, string> = {
  free_trial: 'FREE_TRIAL',
  active: 'ACTIVE',
  payment_pending: 'EXPIRING',
  expiring: 'EXPIRING',
  expired: 'EXPIRED',
  pending: 'FREE_TRIAL',
  payment_failed: 'PAYMENT_FAILED',
  cancelled: 'CANCELLED',
  terminated: 'TERMINATED',
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function mapApiToAdmin(sub: {
  id: number
  partnerId: number
  businessName: string
  ownerName: string | null
  phone: string | null
  planTier: string
  status: string
  trialEndsAt: string | null
  nextPaymentAt: string | null
  autoRenewal: boolean
  paymentStatus: string
  adminMemo: string
}): AdminSubscription {
  return {
    id: String(sub.id),
    businessId: String(sub.partnerId),
    businessName: sub.businessName,
    ownerName: sub.ownerName ?? '',
    ownerPhone: sub.phone ?? '',
    currentPlanId: TIER_TO_PLAN_ID[sub.planTier] ?? 'basic',
    status: sub.status.toLowerCase() as SubscriptionStatus,
    trialEndDate: sub.trialEndsAt ? sub.trialEndsAt.slice(0, 10) : null,
    nextPaymentDate: sub.nextPaymentAt ? sub.nextPaymentAt.slice(0, 10) : null,
    autoRenewal: sub.autoRenewal,
    paymentStatus: sub.paymentStatus.toLowerCase() as AdminSubscription['paymentStatus'],
    adminMemo: sub.adminMemo ?? '',
  }
}

/** 관리자 구독 조작 — 실제 Admin API 연동. */
export async function handleAdminSubscriptionAction(
  subscription: AdminSubscription,
  action: AdminSubscriptionAction,
): Promise<AdminSubscriptionActionResult> {
  const partnerId = Number(subscription.businessId)
  if (!Number.isFinite(partnerId)) {
    return { success: false, subscription, message: '유효하지 않은 업체입니다.' }
  }

  try {
    switch (action.type) {
      case 'change_plan': {
        const result = await updateAdminSubscriptionPlan(
          partnerId,
          PLAN_ID_TO_TIER[action.planId],
          `플랜을 ${action.planId}로 변경`,
        )
        return {
          success: true,
          subscription: mapApiToAdmin(result.subscription),
          message: result.message,
        }
      }
      case 'extend_trial': {
        const base =
          subscription.trialEndDate ?? new Date().toISOString().slice(0, 10)
        const trialEndsAt = addDays(base, action.days)
        const result = await updateAdminSubscriptionTrial(
          partnerId,
          trialEndsAt,
          `무료 기간 ${action.days}일 연장`,
        )
        return {
          success: true,
          subscription: mapApiToAdmin(result.subscription),
          message: result.message,
        }
      }
      case 'force_end': {
        const result = await terminateAdminSubscription(partnerId, '관리자 강제 종료')
        return {
          success: true,
          subscription: mapApiToAdmin(result.subscription),
          message: result.message,
        }
      }
      case 'change_status': {
        const result = await updateAdminSubscriptionStatus(
          partnerId,
          UI_STATUS_TO_API[action.status] ?? action.status.toUpperCase(),
          '상태 변경',
        )
        return {
          success: true,
          subscription: mapApiToAdmin(result.subscription),
          message: result.message,
        }
      }
      default:
        return { success: false, subscription, message: '처리할 수 없습니다.' }
    }
  } catch {
    return { success: false, subscription, message: '구독 조작에 실패했습니다.' }
  }
}
