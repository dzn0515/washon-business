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
import { handleDownloadReceipt } from '@/lib/subscriptions/handleDownloadReceipt'
import { handleToggleAutoRenewal } from '@/lib/subscriptions/handleToggleAutoRenewal'
import {
  SUBSCRIPTION_NOTIFICATION_LABEL,
  type BusinessSubscription,
} from '@/lib/subscriptions/types'
import {
  formatBillingDate,
  planName,
  showNextPayment,
  showTrialRemaining,
} from '@/lib/subscriptions/utils'
import { mockBusinessSubscription } from '@/lib/mock/business-subscription'
import { CARD, BTN_PRIMARY, SECTION_LABEL, won } from '@/lib/dashboard-ui'
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE } from '@/constants'

const NOTIFICATION_STYLE = {
  expiring_soon: 'bg-orange-50 border-orange-200 text-orange-800',
  trial_ending: 'bg-blue-50 border-blue-200 text-blue-800',
  payment_failed: 'bg-red-50 border-red-200 text-red-800',
} as const

function AutoRenewalSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function BillingPage() {
  const { isDemo } = useDemoMode()
  const [subscription, setSubscription] = useState<BusinessSubscription>(mockBusinessSubscription)
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlanId | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [receiptToast, setReceiptToast] = useState<string | null>(null)

  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.currentPlanId)

  async function onApply(planId: SubscriptionPlanId) {
    if (isDemo) return
    setPendingPlan(planId)
    setSubmitting(true)
    await handleApplyPlan(planId)
    setSubmitting(false)
    setModalOpen(true)
  }

  async function onToggleAutoRenewal() {
    if (isDemo) return
    const result = await handleToggleAutoRenewal(subscription)
    setSubscription(result.subscription)
  }

  async function onDownloadReceipt(recordId: string) {
    const record = subscription.paymentHistory.find((r) => r.id === recordId)
    if (!record) return
    await handleDownloadReceipt(record)
    setReceiptToast('영수증 다운로드 준비 중입니다. (Mock)')
    setTimeout(() => setReceiptToast(null), 2500)
  }

  function isCurrentPlan(planId: SubscriptionPlanId): boolean {
    return planId === subscription.currentPlanId
  }

  return (
    <div className="space-y-4">
      {receiptToast && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          {receiptToast}
        </p>
      )}

      <div className={CARD}>
        <p className={SECTION_LABEL}>구독 상태</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">현재 플랜</p>
            <p className="text-base font-bold text-gray-900 mt-1">
              {currentPlan?.name ?? planName(subscription.currentPlanId)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">현재 상태</p>
            <Badge className={`mt-1 ${SUBSCRIPTION_STATUS_STYLE[subscription.status]}`}>
              {SUBSCRIPTION_STATUS_LABEL[subscription.status]}
            </Badge>
          </div>
          {showTrialRemaining(subscription.status) && (
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-[12px] text-blue-600">무료 체험 남은 기간</p>
              <p className="text-base font-bold text-blue-700 mt-1">
                {subscription.trialDaysRemaining ?? '-'}일
              </p>
            </div>
          )}
          {showNextPayment(subscription.status) && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[12px] text-gray-400">다음 결제 예정일</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {formatBillingDate(subscription.nextPaymentDate)}
              </p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-3 col-span-2 sm:col-span-1">
            <p className="text-[12px] text-gray-400 mb-2">자동 갱신</p>
            <div className="flex items-center gap-2">
              <AutoRenewalSwitch
                checked={subscription.autoRenewal}
                disabled={isDemo}
                onChange={onToggleAutoRenewal}
              />
              <span className="text-sm font-medium text-gray-700">
                {subscription.autoRenewal ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
        {isDemo && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
            데모에서는 신청·설정 변경이 저장되지 않습니다.
          </p>
        )}
      </div>

      {subscription.notifications.length > 0 && (
        <div className={CARD}>
          <p className={SECTION_LABEL}>알림</p>
          <div className="space-y-2">
            {subscription.notifications.map((n) => (
              <div
                key={n.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${NOTIFICATION_STYLE[n.type]}`}
              >
                <Badge className="bg-white/80 text-inherit border border-current/20 shrink-0 w-fit">
                  {SUBSCRIPTION_NOTIFICATION_LABEL[n.type]}
                </Badge>
                <span>{n.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subscription.recommendations.length > 0 && (
        <div>
          <p className={SECTION_LABEL}>업그레이드 추천</p>
          <div className="space-y-2">
            {subscription.recommendations.map((rec) => (
              <div key={rec.id} className={`${CARD} border-blue-100 bg-blue-50/30`}>
                <p className="font-semibold text-gray-900">{rec.title}</p>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{rec.description}</p>
                {!isDemo && !isCurrentPlan(rec.targetPlan) && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onApply(rec.targetPlan)}
                    className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {planName(rec.targetPlan)} 변경 신청 →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className={SECTION_LABEL}>요금제</p>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      {current && (
                        <Badge className="bg-blue-100 text-blue-700">이용중</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{won(plan.price)}</p>
                    <p className="text-xs text-gray-500 mt-1">VAT 별도</p>
                    <p className="text-sm text-gray-600 mt-3">
                      예약 플랫폼 수수료 {plan.platformFee}
                    </p>
                    {plan.freeTrialNote && (
                      <p className="text-sm text-blue-600 font-medium mt-1">{plan.freeTrialNote}</p>
                    )}
                    <ul className="mt-3 space-y-1">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-gray-600 flex gap-1.5">
                          <span className="text-blue-500">·</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    disabled={current || submitting || isDemo}
                    onClick={() => onApply(plan.id)}
                    className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                      current
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : isDemo
                          ? 'border border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    {current ? '이용중' : isDemo ? '데모 · 신청 불가' : '변경 신청'}
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
        <div className="flex items-center justify-between mb-2">
          <p className={SECTION_LABEL + ' mb-0'}>결제 이력</p>
          <span className="text-xs text-gray-400">최근 {subscription.paymentHistory.length}건 · Mock</span>
        </div>
        {subscription.paymentHistory.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">결제 이력이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">결제일</th>
                  <th className="pb-2 font-medium">상품</th>
                  <th className="pb-2 font-medium text-right">금액</th>
                  <th className="pb-2 font-medium">상태</th>
                  <th className="pb-2 font-medium text-right">영수증</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscription.paymentHistory.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 text-gray-600">{formatBillingDate(row.paidAt)}</td>
                    <td className="py-3 font-medium text-gray-900">{row.product}</td>
                    <td className="py-3 text-right font-semibold">
                      {row.amount === 0 ? '무료' : won(row.amount)}
                    </td>
                    <td className="py-3">
                      <Badge className={PAYMENT_STATUS_STYLE[row.status]}>
                        {PAYMENT_STATUS_LABEL[row.status]}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDownloadReceipt(row.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        다운로드
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            선택 플랜: {planName(pendingPlan)}
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
