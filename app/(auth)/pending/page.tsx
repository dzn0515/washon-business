'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { clearAuthSession } from '@/lib/api-client'

export default function PendingPage() {
  const router = useRouter()

  const logout = () => {
    clearAuthSession()
    router.push('/login')
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md mx-auto w-full text-center space-y-6">
        <div className="text-3xl">💧</div>
        <h1 className="text-xl font-bold text-gray-900">AUTOON</h1>

        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="text-4xl">⏳</div>
          <h2 className="text-lg font-semibold">승인 대기 중</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            가입 신청을 검토 중입니다.
            <br />
            1~2 영업일 내 승인 완료 후 알림톡으로 안내드립니다.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="secondary" className="w-full" onClick={() => window.open('mailto:support@washon.kr')}>
            문의하기
          </Button>
          <button type="button" onClick={logout} className="text-sm text-gray-500 py-2">
            로그아웃
          </button>
        </div>

        <Link href="/login" className="text-sm text-[#1A6DFF]">로그인 화면으로</Link>
      </div>
    </div>
  )
}
