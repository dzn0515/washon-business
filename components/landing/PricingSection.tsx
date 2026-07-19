import Link from 'next/link'
import { SUBSCRIPTION_PLANS } from '@/lib/billing/catalog'

function formatPrice(price: number): string {
  return `월 ${price.toLocaleString('ko-KR')}원`
}

export default function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">구독 플랜</h2>
          <p className="mt-4 text-lg text-gray-600">
            Basic은 첫 3개월 무료입니다. 모든 요금은 VAT 별도입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const highlight = plan.id === 'standard'
            return (
              <div
                key={plan.id}
                className={`bg-white border rounded-2xl p-6 shadow-sm relative h-full flex flex-col ${
                  highlight ? 'border-blue-600 border-2' : 'border-gray-100'
                }`}
              >
                {highlight ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    추천
                  </span>
                ) : null}
                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-2xl font-bold text-blue-600">{formatPrice(plan.price)}</p>
                <p className="mt-1 text-xs text-gray-500">VAT 별도 · 예약 플랫폼 수수료 {plan.platformFee}~</p>
                {plan.freeTrialNote ? (
                  <p className="mt-1 text-sm font-medium text-blue-600">{plan.freeTrialNote}</p>
                ) : null}
                <ul className="mt-6 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-600" aria-hidden>
                        ·
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500 max-w-2xl mx-auto">
          예약 플랫폼 수수료는 플랜별로 다르며 PG 결제 수수료는 매장 부담입니다. 세부 적용 조건은
          입점 상담 시 안내드립니다.
        </p>

        <div className="text-center mt-8">
          <Link
            href="/join"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            입점 신청하고 시작하기
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            VAT 별도 · Basic 첫 3개월 무료 이후 월 단위 과금 · 언제든 해지 가능
          </p>
        </div>
      </div>
    </section>
  )
}
