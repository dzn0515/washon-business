'use client'

import { useEffect, useState } from 'react'
import { CARD, won } from '@/lib/dashboard-ui'
import {
  fetchBillingMethods,
  fetchBusinessPayments,
  fetchSettlementAccount,
  fetchSettlementSummary,
  fetchBusinessSettlements,
  type BusinessPayment,
  type SettlementSummary,
} from '@/lib/business-payments-api'

export default function PaymentsSettlementsPage() {
  const [summary, setSummary] = useState<SettlementSummary | null>(null)
  const [payments, setPayments] = useState<BusinessPayment[]>([])
  const [settlements, setSettlements] = useState<Array<Record<string, unknown>>>([])
  const [account, setAccount] = useState<Awaited<ReturnType<typeof fetchSettlementAccount>>>(null)
  const [billing, setBilling] = useState<Awaited<ReturnType<typeof fetchBillingMethods>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [s, p, st, a, b] = await Promise.all([
          fetchSettlementSummary(),
          fetchBusinessPayments(1),
          fetchBusinessSettlements(),
          fetchSettlementAccount(),
          fetchBillingMethods(),
        ])
        if (cancelled) return
        setSummary(s)
        setPayments(p.items)
        setSettlements(st.items)
        setAccount(a)
        setBilling(b)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '불러오기 실패')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <div className="p-6 text-sm text-gray-500">불러오는 중…</div>
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">결제·정산</h1>
        <p className="mt-1 text-sm text-gray-500">
          PG: {summary?.payment_gateway ?? '-'} / mode: {summary?.payment_mode ?? '-'} · PG
          수수료는 예상값(estimated)이며 실제 정산 대사 전입니다.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['오늘 결제액', summary?.today_payment_amount],
          ['이번 달 결제액', summary?.month_payment_amount],
          ['환불액', summary?.refund_amount],
          ['정산 예정액', summary?.settlement_due_amount],
          ['AUTOON 수수료', summary?.platform_fee_amount],
          ['PG 수수료(예상)', summary?.pg_fee_amount],
          ['정산 완료액', summary?.settlement_paid_amount],
        ].map(([label, value]) => (
          <div key={String(label)} className={CARD}>
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-lg font-semibold">{won(Number(value ?? 0))}</div>
          </div>
        ))}
      </div>

      <section className={CARD}>
        <h2 className="mb-3 text-sm font-semibold">결제 내역</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-gray-500">
              <tr>
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">예약</th>
                <th className="py-2 pr-3">결제액</th>
                <th className="py-2 pr-3">환불</th>
                <th className="py-2 pr-3">수수료</th>
                <th className="py-2 pr-3">정산예정</th>
                <th className="py-2 pr-3">상태</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{p.id}</td>
                  <td className="py-2 pr-3">{p.reservation_id ?? '-'}</td>
                  <td className="py-2 pr-3">{won(p.approved_amount)}</td>
                  <td className="py-2 pr-3">{won(p.canceled_amount)}</td>
                  <td className="py-2 pr-3">{won(Number(p.platform_fee_amount ?? 0))}</td>
                  <td className="py-2 pr-3">{won(Number(p.partner_settlement_amount ?? 0))}</td>
                  <td className="py-2 pr-3">{p.status}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400">
                    결제 내역이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={CARD}>
        <h2 className="mb-3 text-sm font-semibold">정산 배치</h2>
        <ul className="space-y-2 text-sm">
          {settlements.map((s) => (
            <li key={String(s.id)} className="flex justify-between border-b border-gray-50 py-2">
              <span>
                #{String(s.id)} · {String(s.status)}
              </span>
              <span>{won(Number(s.net_payout_amount ?? 0))}</span>
            </li>
          ))}
          {settlements.length === 0 && <li className="text-gray-400">정산 내역 없음</li>}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={CARD}>
          <h2 className="mb-3 text-sm font-semibold">정산 계좌</h2>
          {account ? (
            <dl className="space-y-1 text-sm">
              <div>은행코드: {account.bank_code}</div>
              <div>계좌: {account.account_number_masked}</div>
              <div>예금주: {account.account_holder}</div>
              <div>인증: {account.verification_status}</div>
              <div>지급가능: {account.payout_enabled ? 'Y' : 'N'}</div>
            </dl>
          ) : (
            <p className="text-sm text-gray-400">등록된 계좌가 없습니다</p>
          )}
        </section>
        <section className={CARD}>
          <h2 className="mb-3 text-sm font-semibold">구독 결제수단</h2>
          <p className="mb-2 text-xs text-gray-500">
            자동결제: {billing?.auto_billing_enabled ? '활성' : '비활성'} · gateway{' '}
            {billing?.payment_gateway}
          </p>
          <ul className="space-y-1 text-sm">
            {(billing?.items ?? []).map((m) => (
              <li key={m.id}>
                {m.card_company ?? m.provider} {m.card_number_masked}
                {m.is_default ? ' (기본)' : ''}
              </li>
            ))}
            {(billing?.items?.length ?? 0) === 0 && (
              <li className="text-gray-400">등록된 카드 없음</li>
            )}
          </ul>
          <a
            href="/dashboard/billing"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            요금제에서 카드 등록·구독 결제 →
          </a>
        </section>
      </div>
    </div>
  )
}
