const PAINS = [
  {
    icon: '📞',
    title: '이중예약·노쇼',
    desc: '전화 예약은 겹치고, 확인 없이 안 오는 고객으로 매출이 새어납니다.',
  },
  {
    icon: '📊',
    title: '정산 엑셀 수작업',
    desc: '일별·월별 매출을 손으로 정리하느라 하루가 끝납니다.',
  },
  {
    icon: '📋',
    title: '단골 데이터 없음',
    desc: '누가 몇 번 왔는지, 언제 왔는지 기록이 없어 재방문을 놓칩니다.',
  },
  {
    icon: '📢',
    title: '마케팅 수단 부재',
    desc: '쿠폰·알림톤 없이는 단골을 다시 부르기 어렵습니다.',
  },
]

export default function PainPointsSection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center">아직도 전화로 예약 받으시나요?</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PAINS.map((pain) => (
            <div
              key={pain.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
            >
              <span className="text-2xl">{pain.icon}</span>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">{pain.title}</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">{pain.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
