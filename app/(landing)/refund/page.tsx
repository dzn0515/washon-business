export const metadata = {
  title: '환불정책 | AUTOON',
  description: 'AUTOON 사장님 구독·광고상품 결제 및 해지 안내',
}

export default function RefundPage() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">환불정책</h1>
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. 적용 범위</h2>
            <p>
              사장님이 AUTOON에 결제하는 구독 플랜 및 거리 기반 광고상품에 적용됩니다. 고객 예약
              대금은 매장 정책에 따릅니다.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. 정기결제 및 제공기간</h2>
            <p>
              유료 구독은 1개월 단위 정기결제이며, 각 결제 건의 서비스 제공기간은 결제일로부터
              1개월입니다. 표시 요금은 VAT 별도입니다.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. 무료기간</h2>
            <p>
              Basic은 입점 승인 후 첫 3개월 무료이며, 무료 종료 후 자동 청구되지 않습니다. 계속
              이용하려면 요금제 화면에서 직접 결제합니다.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. 해지</h2>
            <p>
              요금제 화면에서 자동 갱신을 끄면 다음 결제일 이전 해지로 다음 회차 결제가 중단됩니다.
              이미 결제된 이용기간은 종료일까지 이용할 수 있습니다.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. 광고상품</h2>
            <p>
              광고상품 제공기간은 결제일로부터 1개월이며, 현재 자동 갱신되지 않습니다. 환불·결제
              오류는 dzn7777@gmail.com 또는 010-2725-0175로 문의하세요.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
