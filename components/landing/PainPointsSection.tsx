const PAINS = [
  {
    title: '전화 예약의 한계',
    desc: '통화 중에 예약이 겹치거나, 확인 없는 노쇼로 슬롯이 비는 일이 반복됩니다.',
  },
  {
    title: '고객 기록이 흩어짐',
    desc: '누가 언제 왔는지, 어떤 차량·시공을 했는지 한곳에 모이지 않습니다.',
  },
  {
    title: '재방문 타이밍을 놓침',
    desc: '단골에게 다시 안내할 시점과 수단이 없어 방문 주기를 놓칩니다.',
  },
  {
    title: '근처 고객에게 안 보임',
    desc: '주변에 매장이 있어도 앱·지도 검색에서 노출되지 않으면 신규이 어렵습니다.',
  },
]

export default function PainPointsSection() {
  return (
    <section id="for-customers" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">고객은 가까운 매장을 찾고, 업체는 운영을 정리합니다</h2>
          <p className="mt-4 text-lg text-gray-600">
            차량 관리가 필요할 때 예약하고, 매장은 예약을 안정적으로 받을 수 있어야 합니다.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PAINS.map((pain) => (
            <div
              key={pain.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-gray-900">{pain.title}</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">{pain.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
