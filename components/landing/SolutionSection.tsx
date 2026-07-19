const SOLUTIONS = [
  {
    title: '온라인 예약 관리',
    desc: '캘린더·베이별 슬롯으로 예약을 받고 이중 예약을 줄입니다.',
  },
  {
    title: '고객·차량 CRM',
    desc: '방문 이력, 차량 정보, 단골 관리로 재방문을 준비합니다.',
  },
  {
    title: '매출·정산 기본',
    desc: '일별·월별 매출을 한곳에서 확인합니다.',
  },
  {
    title: '자동화 마케팅',
    desc: 'Standard 이상에서 생일 쿠폰·리뷰 요청·재방문 알림을 앱 Push로 운영합니다.',
  },
  {
    title: '매장 QR·스토어',
    desc: '매장 전용 페이지와 QR로 고객 예약을 연결합니다.',
  },
  {
    title: '거리 기반 노출',
    desc: '플랜 기본 노출과 추가 광고상품으로 주변 고객에게 매장을 소개합니다.',
  },
]

export default function SolutionSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">업체는 예약부터 재방문까지</h2>
          <p className="mt-4 text-lg text-gray-600">
            예약·고객·매출·자동화를 한 화면에서 관리하는 차량 관리 CRM입니다.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SOLUTIONS.map((item) => (
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
