import Link from 'next/link'
import { won } from '@/lib/dashboard-ui'
import type { SaasBillingQuote } from '@/lib/saas-billing-api'

export default function ChargeBreakdown({
  quote,
  nextPaymentHint,
}: {
  quote: SaasBillingQuote
  nextPaymentHint?: string | null
}) {
  return (
    <dl className="space-y-1.5 text-sm text-gray-700">
      <div className="flex justify-between gap-3">
        <dt>월 이용료</dt>
        <dd className="font-medium">{won(quote.supply_amount)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt>VAT (10%)</dt>
        <dd className="font-medium">{won(quote.vat_amount)}</dd>
      </div>
      <div className="flex justify-between gap-3 pt-1 border-t border-gray-100">
        <dt className="font-semibold text-gray-900">최종 결제금액</dt>
        <dd className="font-bold text-blue-600">{won(quote.charge_amount)}</dd>
      </div>
      <div className="flex justify-between gap-3 pt-2 text-xs text-gray-500">
        <dt>결제주기</dt>
        <dd>{quote.auto_billing ? '매월 정기결제' : '1개월 이용 (자동갱신 없음)'}</dd>
      </div>
      <div className="flex justify-between gap-3 text-xs text-gray-500">
        <dt>서비스 제공기간</dt>
        <dd>{quote.service_period_label}</dd>
      </div>
      <div className="flex justify-between gap-3 text-xs text-gray-500">
        <dt>자동결제</dt>
        <dd>{quote.auto_billing ? '동의 시 매월 자동 결제' : '없음'}</dd>
      </div>
      {quote.auto_billing ? (
        <div className="flex justify-between gap-3 text-xs text-gray-500">
          <dt>다음 결제일</dt>
          <dd>{nextPaymentHint || '결제일로부터 1개월 후'}</dd>
        </div>
      ) : null}
      <p className="pt-2 text-xs text-gray-400">
        표시 금액은 VAT 별도 공급가 기준이며, 카드에는 VAT 포함 금액이 청구됩니다.{' '}
        <Link href="/terms" className="text-blue-600 hover:underline">
          이용약관
        </Link>
        {' · '}
        <Link href="/refund" className="text-blue-600 hover:underline">
          환불정책
        </Link>
      </p>
    </dl>
  )
}
