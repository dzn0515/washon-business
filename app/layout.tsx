import type { Metadata, Viewport } from 'next'
import './globals.css'
import UpdateNotifier from '@/components/UpdateNotifier'

export const metadata: Metadata = {
  title: 'AUTOON Business — 세차장 관리자',
  description: 'AUTOON 세차장 사장님 관리자 웹 (business.autoon.kr)',
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
