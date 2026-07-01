import LandingNav from '@/components/landing/LandingNav'
import LandingFooter from '@/components/landing/LandingFooter'

export const metadata = {
  title: 'AUTOON | 자동차 서비스 예약·운영 관리 플랫폼',
  description:
    '세차, 덴트복원, 타이어, 디테일링, 배터리, 유리복원, 블랙박스, 오일교환 업체를 위한 예약·고객·매출 관리 SaaS입니다.',
  keywords:
    '세차장 예약 관리, 덴트복원샵 관리, 타이어샵 예약, 디테일링샵 관리, 배터리 교체 예약, 썬팅샵 관리, 블랙박스 설치 예약, 오일교환 예약, 자동차 서비스 플랫폼',
  openGraph: {
    title: 'AUTOON | 자동차 서비스 예약·운영 관리 플랫폼',
    description:
      '세차, 덴트복원, 타이어, 디테일링, 배터리, 유리복원, 블랙박스, 오일교환 업체를 위한 예약·고객·매출 관리 SaaS입니다.',
    url: 'https://autoon.kr',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AUTOON' }],
    // TODO: /public/og-image.png 실제 이미지로 교체
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
