import Link from 'next/link'

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <p className="text-xl font-bold text-blue-600">AUTOON</p>
            <p className="text-sm text-gray-500 mt-2">차량 관리 예약·CRM 플랫폼</p>
            <p className="text-sm text-gray-400 mt-1">by Sellem Inc.</p>
            <p className="text-sm text-gray-400 mt-1">autoon.kr · business.autoon.kr</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">서비스</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/#pricing" className="hover:text-blue-600 transition-colors">
                  요금제
                </Link>
              </li>
              <li>
                <Link href="/#ads" className="hover:text-blue-600 transition-colors">
                  광고·노출
                </Link>
              </li>
              <li>
                <Link href="/join" className="hover:text-blue-600 transition-colors">
                  입점 신청
                </Link>
              </li>
              <li>
                <a
                  href="https://business.autoon.kr/login"
                  className="hover:text-blue-600 transition-colors"
                >
                  사장님 로그인
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">회사</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-blue-600 transition-colors">
                  회사 소개
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-blue-600 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">법적 고지</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-10 text-center">© 2026 Sellem Inc. All rights reserved.</p>
      </div>
    </footer>
  )
}
