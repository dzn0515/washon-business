const SOLUTIONS = [
  {
    icon: '📅',
    title: '온라인 예약 관리',
    desc: '캘린더·베이별 슬롯으로 24시간 예약을 받고 이중 예약을 차단합니다.',
  },
  {
    icon: '💰',
    title: '자동 정산 리포트',
    desc: '일별·월별 매출과 정산서가 자동 생성됩니다. 엑셀 정산은 그만.',
  },
  {
    icon: '👥',
    title: '고객 CRM',
    desc: '방문 이력, 선호 메뉴, 단골 태그로 재방문율을 높입니다.',
  },
  {
    icon: '🔔',
    title: '알림톡 마케팅 자동화',
    desc: '예약 확인·리마인더·쿠폰 발송을 카카오 알림톡으로 자동화합니다.',
  },
  {
    icon: '📱',
    title: 'QR 브랜딩',
    desc: '매장 전용 QR로 고객에게 앱 예약 경험을 제공합니다.',
  },
  {
    icon: '🎯',
    title: '앱 상단 광고 노출',
    desc: 'AUTOON 앱 내 노출로 신규 고객 유입을 돕습니다.',
  },
]

export default function SolutionSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">AUTOON이 해결합니다</h2>
          <p className="mt-4 text-lg text-gray-600">예약부터 정산·마케팅까지, 매장 운영의 모든 것을 한 곳에서.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SOLUTIONS.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
            >
              <span className="text-2xl">{item.icon}</span>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
