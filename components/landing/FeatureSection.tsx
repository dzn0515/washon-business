const FEATURES = [
  {
    title: '온라인 예약',
    desc: '날짜·시간 슬롯으로 예약을 받고 이중 예약을 줄입니다.',
  },
  {
    title: '실시간 슬롯·베이 관리',
    desc: '베이별 예약 현황을 한눈에 보고 운영합니다.',
  },
  {
    title: '고객·차량 CRM',
    desc: '방문 이력과 차량 정보를 쌓아 재방문 운영에 활용합니다.',
  },
  {
    title: '자동화(Standard+)',
    desc: '생일 쿠폰 · 리뷰 요청 · 재방문 알림을 앱 Push로 운영합니다.',
  },
  {
    title: '매출·정산 기본',
    desc: '일별·월별 매출을 한곳에서 확인합니다.',
  },
  {
    title: '거리 기반 노출',
    desc: '플랜 기본 노출과 추가 광고상품으로 주변 고객에게 매장을 소개합니다.',
  },
]

export default function FeatureSection() {
  return (
    <section id="features-detail" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">매장 운영의 핵심 기능을 한곳에서</h2>
          <p className="mt-4 text-lg text-gray-600">예약부터 CRM·자동화·노출까지 AUTOON으로 관리합니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
