import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '반짝반짝 손세차 | WashOn 예약',
  description: '앱 설치 없이 온라인으로 세차 예약하세요.',
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-gray-50 text-gray-900">
      {children}
    </div>
  )
}
