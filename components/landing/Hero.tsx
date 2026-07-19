import Link from 'next/link'

const HIGHLIGHTS = [
  { value: '예약', label: '고객 앱·QR 예약' },
  { value: 'CRM', label: '고객·차량 이력 관리' },
  { value: '노출', label: '거리 기반 매장 추천' },
]

export default function Hero() {
  return (
    <section id="hero" className="py-16 md:py-24 bg-gradient-to-b from-blue-50/80 to-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-blue-700">AUTOON · 오토온</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            차량 관리 예약부터 매장 운영까지,
            <br className="hidden sm:block" /> AUTOON 하나로
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            고객은 가까운 차량 관리 매장을 찾고 예약하며,
            <br className="hidden sm:block" />
            업체는 예약·고객·매출·재방문을 한곳에서 관리합니다.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            세차 · 광택·디테일링 · 타이어 · 썬팅 · 블랙박스 · 덴트 · 엔진오일 등
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/join"
              className="inline-flex justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              입점신청
            </Link>
            <a
              href="https://business.autoon.kr/demo"
              className="inline-flex justify-center border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-400 transition-colors"
            >
              데모보기
            </a>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.label}
              className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm"
            >
              <p className="text-2xl font-bold text-blue-600">{item.value}</p>
              <p className="mt-2 text-sm text-gray-600">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
