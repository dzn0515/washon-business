import type { SubscriptionPlanId, SubscriptionStatus } from '@/lib/billing/catalog'
import { SUBSCRIPTION_PLANS } from '@/lib/billing/catalog'
import type { UpgradeRecommendation } from './types'

export function formatBillingDate(d: string | null | undefined): string {
  if (!d) return '-'
  return d.includes('.') ? d : d.replace(/-/g, '.')
}

export function planName(planId: SubscriptionPlanId): string {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId)?.name ?? planId
}

export function platformFeeForPlan(planId: SubscriptionPlanId): string {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId)?.platformFee ?? '-'
}

export function defaultRecommendations(
  currentPlanId: SubscriptionPlanId,
  status: SubscriptionStatus,
): UpgradeRecommendation[] {
  const recs: UpgradeRecommendation[] = []

  if (currentPlanId === 'basic' && (status === 'free_trial' || status === 'active')) {
    recs.push({
      id: 'rec-standard',
      title: 'Standard 업그레이드 추천',
      description:
        '이번 달 예약이 증가했습니다. Standard로 변경하면 예약 플랫폼 수수료를 절감할 수 있습니다.',
      targetPlan: 'standard',
    })
  }

  if (currentPlanId !== 'premium') {
    recs.push({
      id: 'rec-premium',
      title: 'Premium 추천',
      description: '다지점 운영이라면 Premium을 추천합니다.',
      targetPlan: 'premium',
    })
  }

  return recs
}

export function showTrialRemaining(status: SubscriptionStatus): boolean {
  return status === 'free_trial'
}

export function showNextPayment(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'expiring' || status === 'payment_pending'
}
