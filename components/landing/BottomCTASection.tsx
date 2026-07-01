import Link from 'next/link'

export default function BottomCTASection() {
  return (
    <section className="py-16 md:py-24 bg-blue-600">
      <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
        <h2 className="text-3xl font-bold text-white">지금 입점하면 3개월 무료</h2>
        <p className="mt-4 text-lg text-blue-100">부담 없이 시작하고, 매장 운영을 디지털로 전환하세요.</p>
        <Link
          href="/join"
          className="inline-block mt-8 bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
        >
          입점 문의하기
        </Link>
      </div>
    </section>
  )
}
