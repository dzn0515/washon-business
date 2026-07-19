import type { Metadata, Viewport } from 'next'
import './globals.css'
import UpdateNotifier from '@/components/UpdateNotifier'

export const metadata: Metadata = {
  metadataBase: new URL('https://autoon.kr'),
  title: {
    default: 'AUTOON | 차량 관리 예약·매장 CRM',
    template: '%s | AUTOON',
  },
  description: 'AUTOON 차량 관리 예약·매장 CRM (autoon.kr / business.autoon.kr)',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E40AF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
        <UpdateNotifier />
      </body>
    </html>
  )
}
