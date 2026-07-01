const STEPS = [
  {
    step: 1,
    title: '입점 신청',
    desc: '간단한 문의 폼으로 입점을 신청합니다.',
  },
  {
    step: 2,
    title: '무료 세팅 지원',
    desc: '담당자가 매장 등록·메뉴 설정을 도와드립니다. 3개월 무료.',
  },
  {
    step: 3,
    title: '예약 영업 시작',
    desc: '앱·QR 예약이 오픈되면 바로 고객을 받을 수 있습니다.',
  },
]

export default function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">3단계로 시작합니다</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mx-auto">
                {item.step}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
