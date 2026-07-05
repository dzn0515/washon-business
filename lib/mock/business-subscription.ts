import type { BusinessSubscription } from '@/lib/subscriptions/types'
import { defaultRecommendations } from '@/lib/subscriptions/utils'

/** 클린카워시 강남점 기준 사장님 구독 Mock */
export const mockBusinessSubscription: BusinessSubscription = {
  currentPlanId: 'basic',
  status: 'free_trial',
  trialDaysRemaining: 72,
  trialEndDate: '2026-10-05',
  nextPaymentDate: '2026-10-15',
  autoRenewal: true,
  notifications: [
    {
      id: 'notif-trial',
      type: 'trial_ending',
      message: '무료 체험이 72일 후 종료됩니다. 종료 전 요금제를 확인해 주세요.',
    },
  ],
  recommendations: defaultRecommendations('basic', 'free_trial'),
  paymentHistory: [
    {
      id: 'pay-001',
      paidAt: '2026-07-01',
      product: 'Basic 구독 (무료 체험)',
      amount: 0,
      status: 'PAID',
    },
    {
      id: 'pay-002',
      paidAt: '2026-06-01',
      product: 'Basic 구독 (무료 체험)',
      amount: 0,
      status: 'PAID',
    },
    {
      id: 'pay-003',
      paidAt: '2026-05-01',
      product: 'Basic 구독 (무료 체험)',
      amount: 0,
      status: 'PAID',
    },
    {
      id: 'pay-004',
      paidAt: '2026-04-01',
      product: '앱 메인 배너 (1회)',
      amount: 80000,
      status: 'PAID',
    },
    {
      id: 'pay-005',
      paidAt: '2026-03-15',
      product: '검색 상단 고정 (1회)',
      amount: 50000,
      status: 'PAID',
    },
  ],
}
