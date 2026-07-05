import type { PaymentStatus } from '@/types'
import type { SubscriptionPlanId, SubscriptionStatus } from '@/lib/billing/catalog'

export type SubscriptionNotificationType =
  | 'expiring_soon'
  | 'trial_ending'
  | 'payment_failed'

export type SubscriptionNotification = {
  id: string
  type: SubscriptionNotificationType
  message: string
}

export type UpgradeRecommendation = {
  id: string
  title: string
  description: string
  targetPlan: SubscriptionPlanId
}

export type BusinessPaymentRecord = {
  id: string
  paidAt: string
  product: string
  amount: number
  status: PaymentStatus
}

export type BusinessSubscription = {
  currentPlanId: SubscriptionPlanId
  status: SubscriptionStatus
  trialDaysRemaining: number | null
  trialEndDate: string | null
  nextPaymentDate: string | null
  autoRenewal: boolean
  notifications: SubscriptionNotification[]
  recommendations: UpgradeRecommendation[]
  paymentHistory: BusinessPaymentRecord[]
}

export type AdminSubscriptionPaymentStatus = 'paid' | 'pending' | 'failed' | 'none'

export type AdminSubscription = {
  id: string
  businessId: string
  businessName: string
  ownerName: string
  ownerPhone: string
  currentPlanId: SubscriptionPlanId
  status: SubscriptionStatus
  trialEndDate: string | null
  nextPaymentDate: string | null
  autoRenewal: boolean
  paymentStatus: AdminSubscriptionPaymentStatus
  adminMemo: string
}

export const SUBSCRIPTION_NOTIFICATION_LABEL: Record<SubscriptionNotificationType, string> = {
  expiring_soon: '만료 7일 전',
  trial_ending: '무료 체험 종료',
  payment_failed: '결제 실패',
}

export const ADMIN_PAYMENT_STATUS_LABEL: Record<AdminSubscriptionPaymentStatus, string> = {
  paid: '정상',
  pending: '결제 대기',
  failed: '결제 실패',
  none: '-',
}
