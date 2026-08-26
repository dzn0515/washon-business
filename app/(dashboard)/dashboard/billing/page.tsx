'use client'

import { useCallback, useEffect, useState } from 'react'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ChargeBreakdown from '@/components/billing/ChargeBreakdown'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS_LABEL,
  SUBSCRIPTION_STATUS_STYLE,
  type SubscriptionPlanId,
} from '@/lib/billing/catalog'
import { savePendingSaasCheckout } from '@/lib/billing/pendingCheckout'
import { requestTossBillingAuth } from '@/lib/billing/tossBilling'
import { vatQuote } from '@/lib/billing/vat'
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
import {
  checkoutSaasSubscription,
  fetchSaasBillingConfig,
  fetchSaasBillingQuote,
  fetchSaasSubscription,
  type SaasBillingConfig,
  type SaasBillingMethod,
  type SaasBillingQuote,
  type SaasSubscriptionOverview,
} from '@/lib/saas-billing-api'

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

function planQuoteFallback(planId: SubscriptionPlanId): SaasBillingQuote {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  const q = vatQuote(plan?.price ?? 0)
  return {
    kind: 'subscription',
    plan_id: planId,
    plan_name: plan?.name ?? planId,
    order_name: `AUTOON ${plan?.name ?? planId} 구독`,
    ...q,
  }
}

export default function BillingPage() {
  const { isDemo } = useDemoMode()
  const [subscription, setSubscription] = useState<BusinessSubscription>(mockBusinessSubscription)
  const [methods, setMethods] = useState<SaasBillingMethod[]>([])
  const [config, setConfig] = useState<SaasBillingConfig | null>(null)
  const [loading, setLoading] = useState(!isDemo)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlanId | null>(null)
  const [pendingQuote, setPendingQuote] = useState<SaasBillingQuote | null>(null)
  const [selectedMethodId, setSelectedMethodId] = useState<number | 'new'>('new')
  const [submitting, setSubmitting] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [receiptToast, setReceiptToast] = useState<string | null>(null)
  const [autoRenewalConsent, setAutoRenewalConsent] = useState(true)

  const applyOverview = useCallback((overview: SaasSubscriptionOverview) => {
    setSubscription(overview)
    setMethods(overview.billingMethods ?? [])
  }, [])

  const refresh = useCallback(async () => {
    const [overview, cfg] = await Promise.all([fetchSaasSubscription(), fetchSaasBillingConfig()])
    applyOverview(overview)
    setConfig(cfg)
    const defaultMethod = (overview.billingMethods ?? []).find((m) => m.is_default)
    setSelectedMethodId(defaultMethod?.id ?? 'new')
  }, [applyOverview])

  useEffect(() => {
    if (isDemo) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        await refresh()
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : '구독 정보를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isDemo, refresh])

  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.currentPlanId)

  async function onApply(planId: SubscriptionPlanId) {
    if (isDemo) return
    setPayError(null)
    setPendingPlan(planId)
    try {
      const quote = await fetchSaasBillingQuote({ kind: 'subscription', planId })
      setPendingQuote(quote)
    } catch {
      setPendingQuote(planQuoteFallback(planId))
    }
    setConfirmOpen(true)
  }

  async function onConfirmPay() {
    if (!pendingPlan || isDemo) return
    setSubmitting(true)
    setPayError(null)
    try {
      const cfg = config ?? (await fetchSaasBillingConfig())
      setConfig(cfg)
      if (!cfg.billing_available) {
        throw new Error('구독 결제가 아직 연결되지 않았습니다. 관리자에게 문의해 주세요.')
      }
      const useExisting = selectedMethodId !== 'new' && typeof selectedMethodId === 'number'
      if (useExisting) {
        const result = await checkoutSaasSubscription({
          plan_id: pendingPlan,
          billing_method_id: selectedMethodId,
          auto_renewal: autoRenewalConsent,
        })
        applyOverview(result.subscription)
        setConfirmOpen(false)
        setDoneOpen(true)
        return
      }
      if (cfg.widget !== 'requestBillingAuth' || cfg.payment_gateway === 'mock') {
        const result = await checkoutSaasSubscription({
          plan_id: pendingPlan,
          auth_key: 'mock_auth',
          customer_key: cfg.customer_key,
          auto_renewal: autoRenewalConsent,
        })
        applyOverview(result.subscription)
        setConfirmOpen(false)
        setDoneOpen(true)
        return
      }
      savePendingSaasCheckout({
        kind: 'subscription',
        planId: pendingPlan,
        autoRenewal: autoRenewalConsent,
      })
      await requestTossBillingAuth({
        clientKey: cfg.client_key,
        customerKey: cfg.customer_key,
        successUrl: `${window.location.origin}/dashboard/billing/callback`,
        failUrl: `${window.location.origin}/dashboard/billing?billing=fail`,
      })
    } catch (e) {
      setPayError(e instanceof Error ? e.message : '결제에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
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
    setReceiptToast('영수증은 카드사·토스페이먼츠 결제 내역에서 확인할 수 있습니다.')
    setTimeout(() => setReceiptToast(null), 2500)
  }

  function isCurrentPlan(planId: SubscriptionPlanId): boolean {
    return planId === subscription.currentPlanId
  }

  if (loading) {
    return <p className="text-sm text-gray-500">구독 정보를 불러오는 중…</p>
  }

  return (
    <div className="space-y-4">
      {receiptToast && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          {receiptToast}
        </p>
      )}
      {loadError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {loadError}
        </p>
      )}
      {config && !config.billing_available && !isDemo && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          카드 결제가 아직 활성화되지 않았습니다. 요금제 안내는 가능하며, PG 연결 후 결제할 수
          있습니다.
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
              <p className="text-[12px] text-gray-400">다음 결제일</p>
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
        {subscription.status === 'free_trial' && (
          <p className="text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-3 leading-relaxed">
            Basic 무료 체험 이용 중입니다. 종료일 {formatBillingDate(subscription.trialEndDate)}.
            무료 종료 후 자동 청구되지 않습니다. 계속 이용하려면 Standard/Premium 또는 체험 종료 후
            Basic(월 28,000원 + VAT 2,800원 = 30,800원)을 직접 결제하세요.
          </p>
        )}
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>결제 카드</p>
        {methods.length === 0 ? (
          <p className="text-sm text-gray-500">등록된 카드가 없습니다. 요금제 결제 시 카드를 등록합니다.</p>
        ) : (
          <ul className="space-y-1 text-sm text-gray-800">
            {methods.map((m) => (
              <li key={m.id}>
                {m.card_company ?? m.provider} {m.card_number_masked}
                {m.is_default ? ' (기본)' : ''}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-gray-400">
          카드번호·CVC·유효기간은 AUTOON에 저장되지 않습니다. 토스페이먼츠 결제창에서만 입력합니다.
        </p>
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
                    {planName(rec.targetPlan)} 결제하기 →
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
            const q = vatQuote(plan.price)
            const basicTrialLock =
              subscription.status === 'free_trial' && plan.id === 'basic' && !current
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
                    <p className="text-xs text-gray-500 mt-1">
                      VAT 별도 · VAT {won(q.vat_amount)} · 청구 {won(q.charge_amount)}
                    </p>
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
                    disabled={current || submitting || isDemo || basicTrialLock}
                    onClick={() => onApply(plan.id)}
                    className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                      current || basicTrialLock
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : isDemo
                          ? 'border border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    {current
                      ? '이용중'
                      : basicTrialLock
                        ? '무료 체험 중'
                        : isDemo
                          ? '데모 · 결제 불가'
                          : '결제하기'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          VAT 별도 · 결제주기 매월 · 서비스 제공기간 결제일로부터 1개월 · 예약 플랫폼 수수료와 PG
          수수료는 별도
        </p>
      </div>

      <div className={CARD}>
        <div className="flex items-center justify-between mb-2">
          <p className={SECTION_LABEL + ' mb-0'}>결제 이력</p>
          <span className="text-xs text-gray-400">최근 {subscription.paymentHistory.length}건</span>
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
                        안내
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!submitting) setConfirmOpen(false)
        }}
        title="결제 정보 확인"
        size="sm"
      >
        {pendingQuote ? (
          <ChargeBreakdown
            quote={pendingQuote}
            nextPaymentHint="결제일로부터 1개월 후"
          />
        ) : null}
        <label className="mt-4 flex items-start gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={autoRenewalConsent}
            onChange={(e) => setAutoRenewalConsent(e.target.checked)}
          />
          <span>
            자동결제에 동의합니다. 다음 결제일부터 같은 금액이 매월 청구되며, 요금제 화면에서 자동
            갱신을 끄면 다음 회차부터 중단됩니다.
          </span>
        </label>
        {methods.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-gray-500">결제 카드</p>
            {methods.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name="billing-method"
                  checked={selectedMethodId === m.id}
                  onChange={() => setSelectedMethodId(m.id)}
                />
                {m.card_company ?? m.provider} {m.card_number_masked}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-gray-800">
              <input
                type="radio"
                name="billing-method"
                checked={selectedMethodId === 'new'}
                onChange={() => setSelectedMethodId('new')}
              />
              새 카드 등록
            </label>
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-500">
            확인을 누르면 토스페이먼츠 카드 등록창이 열립니다.
          </p>
        )}
        {payError ? <p className="mt-3 text-xs text-red-600">{payError}</p> : null}
        <button
          type="button"
          disabled={submitting}
          onClick={onConfirmPay}
          className={`${BTN_PRIMARY} w-full mt-5 disabled:opacity-50`}
        >
          {submitting ? '결제 진행 중…' : '카드 등록 후 결제'}
        </button>
      </Modal>

      <Modal open={doneOpen} onClose={() => setDoneOpen(false)} title="구독 활성화" size="sm">
        <p className="text-sm text-gray-600 leading-relaxed">
          결제가 완료되어 구독이 활성화되었습니다.
        </p>
        {pendingPlan && (
          <p className="text-xs text-gray-400 mt-3">선택 플랜: {planName(pendingPlan)}</p>
        )}
        <button
          type="button"
          onClick={() => setDoneOpen(false)}
          className={`${BTN_PRIMARY} w-full mt-5`}
        >
          확인
        </button>
      </Modal>
    </div>
  )
}
