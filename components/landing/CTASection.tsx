import Link from 'next/link'
import KakaoChannelButton from './KakaoChannelButton'

export default function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-blue-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">입점 전 궁금한 점이 있으신가요?</h2>
        <p className="mt-4 text-lg text-gray-600">담당자가 직접 상담해 드립니다.</p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/join"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            입점 문의하기
          </Link>
          <KakaoChannelButton />
        </div>
      </div>
    </section>
  )
}
