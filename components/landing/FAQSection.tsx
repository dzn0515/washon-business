'use client'

import { useState } from 'react'

const FAQ_ITEMS = [
  {
    q: 'AUTOON은 어떤 업종에서 사용할 수 있나요?',
    a: '세차, 광택·디테일링, 타이어, 썬팅, 블랙박스·내비게이션, 덴트·외형복원, 엔진오일·경정비 등 차량 관리·자동차 서비스 매장에서 사용할 수 있습니다. 세차장 전용 서비스가 아닙니다.',
  },
  {
    q: '고객은 어떻게 예약하나요?',
    a: '고객은 AUTOON 앱에서 가까운 매장을 찾아 예약하거나, 매장 전용 QR·스토어 페이지를 통해 예약을 진행할 수 있습니다.',
  },
  {
    q: 'Basic·Standard·Premium 차이는 무엇인가요?',
    a: 'Basic(월 28,000원)은 예약·고객·매출 기본 기능과 500m 노출이 포함되며 자동화는 없습니다. Standard(월 59,000원)는 생일·리뷰·재방문 자동화와 500m 노출이 포함됩니다. Premium(월 99,000원)은 Standard 기능에 더해 1.5km 거리 노출이 포함됩니다. 모든 요금은 VAT 별도입니다.',
  },
  {
    q: '자동화 기능은 어느 플랜부터 사용할 수 있나요?',
    a: '생일 쿠폰, 리뷰 요청, 재방문 알림 자동화는 Standard와 Premium에서 사용할 수 있습니다. Basic에서는 실행되지 않습니다.',
  },
  {
    q: 'Premium 플랜의 1.5km 노출은 별도 신청이 필요한가요?',
    a: '필요하지 않습니다. Premium 구독이 유효하면 월 30,000원 상당의 1.5km 거리 노출이 별도 신청 없이 포함됩니다.',
  },
  {
    q: '추가 광고상품에는 무엇이 있나요?',
    a: '지역 노출 1km(월 15,000원), 1.5km(월 30,000원), 3km(월 50,000원), 10km Premium(월 100,000원)을 추가로 구매할 수 있습니다. 모두 VAT 별도입니다.',
  },
  {
    q: '10km Premium은 전국 광고인가요?',
    a: '아닙니다. 10km Premium은 반경 10km 노출과 홈 추천 후보·우선 노출·Premium 배지 혜택이 있는 지역 광고상품입니다. 전국 노출 상품은 운영하지 않습니다.',
  },
  {
    q: '광고가 항상 모든 고객에게 표시되나요?',
    a: '아닙니다. 고객 위치와 매장 좌표가 있을 때, 설정된 반경 안에서 추천·광고 후보로 노출됩니다. 노출 보장을 의미하지 않습니다.',
  },
  {
    q: '결제 수수료는 누가 부담하나요?',
    a: '예약 플랫폼 수수료는 플랜별로 Basic 8.9%~, Standard 6.9%~, Premium 4.9%~가 적용됩니다. PG 결제 수수료는 매장 부담이며, 요금은 VAT 별도입니다.',
  },
  {
    q: '무료체험 종료 후 자동 결제되나요?',
    a: 'Basic 첫 3개월 무료 이후에는 월 단위 구독 요금이 적용됩니다. 결제 수단 등록과 청구 시점은 입점·구독 설정 과정에서 안내되며, 언제든 해지할 수 있습니다.',
  },
  {
    q: '입점 신청 후 승인 절차는 어떻게 되나요?',
    a: '입점 신청서를 접수하면 담당자가 매장 정보를 확인한 뒤 연락드립니다. 상담·매장 등록·메뉴 설정 후 예약을 오픈합니다.',
  },
  {
    q: '고객 데이터와 매장 데이터는 어떻게 관리되나요?',
    a: '매장별 고객·예약·매출 데이터는 사장님 계정 권한으로 관리됩니다. 자세한 처리 방침은 개인정보처리방침을 확인해 주세요.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">자주 묻는 질문</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const open = openIndex === i
            const panelId = `faq-panel-${i}`
            const buttonId = `faq-button-${i}`
            return (
              <div key={item.q} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenIndex(open ? null : i)}
                >
                  <span className="font-semibold text-gray-900 pr-4">Q. {item.q}</span>
                  <span className="text-gray-400 shrink-0" aria-hidden>
                    {open ? '−' : '+'}
                  </span>
                </button>
                {open ? (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-6 pb-4 text-gray-600 leading-relaxed border-t border-gray-50 pt-3"
                  >
                    {item.a}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
