import type { SubscriptionPlanId, SubscriptionStatus } from '@/lib/billing/catalog'
import type { AdminSubscription } from './types'

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

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Phase 3: Mock 관리자 구독 조작. 추후 API 연동 시 내부만 교체. */
export async function handleAdminSubscriptionAction(
  subscription: AdminSubscription,
  action: AdminSubscriptionAction,
): Promise<AdminSubscriptionActionResult> {
  switch (action.type) {
    case 'change_plan':
      return {
        success: true,
        subscription: { ...subscription, currentPlanId: action.planId },
        message: `플랜을 ${action.planId}로 변경했습니다. (Mock)`,
      }
    case 'extend_trial': {
      const base = subscription.trialEndDate ?? new Date().toISOString().slice(0, 10)
      return {
        success: true,
        subscription: {
          ...subscription,
          status: 'free_trial',
          trialEndDate: addDays(base, action.days),
        },
        message: `무료 기간 ${action.days}일 연장. (Mock)`,
      }
    }
    case 'force_end':
      return {
        success: true,
        subscription: {
          ...subscription,
          status: 'expired',
          autoRenewal: false,
          nextPaymentDate: null,
          paymentStatus: 'none',
        },
        message: '구독을 강제 종료했습니다. (Mock)',
      }
    case 'change_status':
      return {
        success: true,
        subscription: {
          ...subscription,
          status: action.status,
          paymentStatus:
            action.status === 'payment_failed'
              ? 'failed'
              : action.status === 'payment_pending'
                ? 'pending'
                : subscription.paymentStatus,
        },
        message: `상태를 변경했습니다. (Mock)`,
      }
    default:
      return { success: false, subscription, message: '처리할 수 없습니다.' }
  }
}
