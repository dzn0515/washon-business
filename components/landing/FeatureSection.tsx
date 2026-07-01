const FEATURES = [
  {
    icon: '📅',
    title: '온라인 예약',
    desc: '24시간 온라인 예약. 전화 없이도 빈 슬롯이 자동으로 채워집니다.',
  },
  {
    icon: '🗓️',
    title: '실시간 슬롯·베이 관리',
    desc: '베이별 예약 현황을 한눈에. 이중 예약은 시스템이 원천 차단합니다.',
  },
  {
    icon: '👥',
    title: '고객 CRM',
    desc: '방문 이력, 선호 메뉴, 단골 태그. 데이터가 쌓일수록 재방문율이 올라갑니다.',
  },
  {
    icon: '🎁',
    title: '쿠폰·재방문 관리',
    desc: '미방문 고객에게 자동 쿠폰 발송. 한 번 온 고객이 다시 옵니다.',
  },
  {
    icon: '💰',
    title: '매출 관리',
    desc: '일별·월별 매출과 정산서가 자동 생성. 엑셀 정산은 이제 그만.',
  },
  {
    icon: '🔔',
    title: '알림',
    desc: '예약 확인·리마인더·취소 알림을 카카오 알림톡과 앱 푸시로 자동 발송.',
  },
]

export default function FeatureSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">매장 운영의 모든 것을 한 곳에서</h2>
          <p className="mt-4 text-lg text-gray-600">AUTOON 하나로 예약부터 정산까지 자동화합니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
