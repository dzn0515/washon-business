import AdExposureSection from '@/components/landing/AdExposureSection'
import PricingSection from '@/components/landing/PricingSection'
import Link from 'next/link'

export const metadata = {
  title: '요금제 | AUTOON',
  description:
    'AUTOON 구독 플랜 Basic 28,000원 · Standard 59,000원 · Premium 99,000원(VAT 별도). 거리 기반 광고상품과 자동화 안내.',
  alternates: {
    canonical: 'https://autoon.kr/pricing',
  },
  openGraph: {
    title: '요금제 | AUTOON',
    description:
      'Basic·Standard·Premium 구독과 1km·1.5km·3km·10km Premium 광고상품. 모든 요금 VAT 별도.',
    url: 'https://autoon.kr/pricing',
  },
}

export default function PricingPage() {
  return (
    <>
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900">요금제 · 광고상품</h1>
          <p className="mt-3 text-gray-600">
            구독 플랜과 거리 기반 광고상품을 확인하세요.{' '}
            <Link href="/join" className="text-blue-600 hover:underline">
              입점 신청
            </Link>
          </p>
        </div>
      </div>
      <PricingSection />
      <AdExposureSection />
    </>
  )
}
