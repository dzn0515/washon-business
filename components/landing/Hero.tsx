import Link from 'next/link'

const BUSINESS_URL = 'https://business.autoon.kr'

const STATS = [
  { value: '20,000+', label: '국내 세차장 수' },
  { value: '5% 미만', label: '온라인 전환율' },
  { value: '3개월', label: '무료 온보딩' },
]

export default function Hero() {
  return (
    <section id="hero" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="max-w-3xl">
          <span className="inline-block bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm font-medium">
            전국 자동차 서비스 예약·운영 플랫폼
          </span>
          <h1 className="mt-6 text-4xl md:text-5xl font-bold text-gray-900 leading-tight whitespace-pre-line">
            수기 예약장은{'\n'}이제 끝입니다
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            세차, 덴트, 타이어, 디테일링 등 자동차 서비스 업체를 위한 예약·운영 관리 플랫폼입니다.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/join"
              className="inline-flex justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              입점 문의하기
            </Link>
            <a
              href={BUSINESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-400 transition-colors"
            >
              사장님 로그인
            </a>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center"
            >
              <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
              <p className="mt-2 text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
