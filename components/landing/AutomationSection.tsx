const ITEMS = [
  {
    title: '생일 쿠폰',
    desc: '고객 생일에 맞춰 매장에서 설정한 쿠폰을 발송합니다. Standard 플랜부터 사용할 수 있습니다.',
  },
  {
    title: '리뷰 요청',
    desc: '이용 완료 고객에게 리뷰 작성을 요청합니다. 동일 예약에 대한 중복 발송을 방지합니다.',
  },
  {
    title: '재방문 알림',
    desc: '마지막 이용 후 업체가 설정한 기간(14·30·60·90일)이 지나면 안내합니다. 마케팅 수신 동의가 있는 고객을 대상으로 앱 Push로 발송합니다.',
  },
]

export default function AutomationSection() {
  return (
    <section id="automation" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">자동화로 단골을 다시 부릅니다</h2>
          <p className="mt-4 text-lg text-gray-600">
            Standard·Premium 플랜에 포함됩니다. Basic에서는 사용할 수 없습니다.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-gray-500">
          발송 채널은 고객앱 Push 및 앱 내 알림입니다. 수신 여부와 수신 기간은 매장에서 관리합니다.
        </p>
      </div>
    </section>
  )
}
