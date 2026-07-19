import Link from 'next/link'

export default function BottomCTASection() {
  return (
    <section className="py-16 md:py-24 bg-blue-600">
      <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
        <h2 className="text-3xl font-bold text-white">Basic 첫 3개월 무료로 시작하세요</h2>
        <p className="mt-4 text-lg text-blue-100">
          입점 신청 후 담당자 상담을 거쳐 매장 등록·메뉴 설정·예약 오픈까지 안내드립니다.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/join"
            className="inline-block bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            입점 신청하기
          </Link>
          <a
            href="https://business.autoon.kr/login"
            className="inline-block border border-white/40 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            사장님 로그인
          </a>
        </div>
      </div>
    </section>
  )
}
