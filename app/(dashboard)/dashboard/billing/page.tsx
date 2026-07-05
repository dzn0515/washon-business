'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS_LABEL,
  SUBSCRIPTION_STATUS_STYLE,
  type SubscriptionPlanId,
} from '@/lib/billing/catalog'
import { handleApplyPlan } from '@/lib/billing/handleApplyPlan'
import { mockBilling, mockBillingHistory } from '@/lib/mock/data'
import { CARD, BTN_PRIMARY, SECTION_LABEL, won } from '@/lib/dashboard-ui'
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE } from '@/constants'

export default function BillingPage() {
  const { isDemo } = useDemoMode()
  const [billing] = useState(mockBilling)
  const [history] = useState(mockBillingHistory)
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlanId | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === billing.currentPlanId)

  async function onApply(planId: SubscriptionPlanId) {
    setPendingPlan(planId)
    setSubmitting(true)
    await handleApplyPlan(planId)
    setSubmitting(false)
    setModalOpen(true)
  }

  function isCurrentPlan(planId: SubscriptionPlanId): boolean {
    return planId === billing.currentPlanId
  }

  function applyLabel(planId: SubscriptionPlanId): string {
    if (isCurrentPlan(planId)) return '이용중'
    return planId === 'basic' ? '신청하기' : '변경 신청'
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-600 text-white rounded-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm opacity-80">현재 이용중 플랜</p>
            <p className="text-xl font-bold mt-1">{currentPlan?.name ?? 'Basic'}</p>
          </div>
          <Badge className={SUBSCRIPTION_STATUS_STYLE[billing.status]}>
            {SUBSCRIPTION_STATUS_LABEL[billing.status]}
          </Badge>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 text-sm space-y-1">
          <p>다음 결제 예정일 · {billing.nextPaymentDate}</p>
          <p className="font-medium">예약 플랫폼 수수료 {billing.platformFee}부터</p>
          {isDemo && (
            <p className="text-xs opacity-70 mt-2">데모 모드 · Mock 데이터 · 실제 결제 없음</p>
          )}
        </div>
      </div>

      <div>
        <p className={SECTION_LABEL}>요금제 선택</p>
        <div className="space-y-3">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const current = isCurrentPlan(plan.id)
            return (
              <div
                key={plan.id}
                className={`${CARD} ${current ? 'border-blue-300 bg-blue-50/40' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      {current && (
                        <Badge className="bg-blue-100 text-blue-700">이용중</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{won(plan.price)}</p>
                    <p className="text-xs text-gray-500 mt-1">VAT 별도</p>
                    <p className="text-sm text-gray-600 mt-3">
                      예약 플랫폼 수수료 {plan.platformFee}부터
                    </p>
                    {plan.freeTrialNote && (
                      <p className="text-sm text-blue-600 font-medium mt-1">{plan.freeTrialNote}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={current || submitting}
                    onClick={() => onApply(plan.id)}
                    className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                      current
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : 'border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    {applyLabel(plan.id)}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          VAT 별도 · 예약 플랫폼 수수료 적용 · 결제대행사(PG) 수수료 별도
        </p>
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>결제 이력</p>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">결제 이력이 없습니다.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{row.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{row.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {row.amount === 0 ? '무료' : won(row.amount)}
                  </p>
                  <Badge className={`mt-1 ${PAYMENT_STATUS_STYLE[row.status]}`}>
                    {PAYMENT_STATUS_LABEL[row.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="신청 접수" size="sm">
        <p className="text-sm text-gray-600 leading-relaxed">
          요금제 신청이 접수되었습니다.
          <br />
          담당자가 확인 후 안내드립니다.
        </p>
        {pendingPlan && (
          <p className="text-xs text-gray-400 mt-3">
            선택 플랜: {SUBSCRIPTION_PLANS.find((p) => p.id === pendingPlan)?.name}
          </p>
        )}
        <button
          type="button"
          onClick={() => setModalOpen(false)}
          className={`${BTN_PRIMARY} w-full mt-5`}
        >
          확인
        </button>
      </Modal>
    </div>
  )
}
