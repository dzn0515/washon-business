import LandingNav from '@/components/landing/LandingNav'
import LandingFooter from '@/components/landing/LandingFooter'

export const metadata = {
  title: 'AUTOON | 차량 관리 예약·매장 CRM 플랫폼',
  description:
    '가까운 차량 관리 매장 예약과 업체용 예약·고객·매출·재방문 관리. 세차, 타이어, 썬팅, 디테일링, 덴트 등 AUTOON 하나로.',
  keywords: [
    '차량 관리 예약',
    '자동차 관리 앱',
    '세차장 예약',
    '차량 관리 CRM',
    '매장 예약 관리',
    '고객 관리 프로그램',
    '타이어 예약',
    '썬팅 예약',
    'AUTOON',
    '오토온',
  ],
  alternates: {
    canonical: 'https://autoon.kr',
  },
  openGraph: {
    title: 'AUTOON | 차량 관리 예약·매장 CRM 플랫폼',
    description:
      '고객은 가까운 차량 관리 매장을 예약하고, 업체는 예약·고객·매출·재방문을 한곳에서 관리합니다.',
    url: 'https://autoon.kr',
    siteName: 'AUTOON',
    locale: 'ko_KR',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AUTOON' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AUTOON | 차량 관리 예약·매장 CRM 플랫폼',
    description:
      '고객은 가까운 차량 관리 매장을 예약하고, 업체는 예약·고객·매출·재방문을 한곳에서 관리합니다.',
    images: ['/og-image.png'],
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <main>{children}</main>
      <LandingFooter />
    </div>
  )
}
