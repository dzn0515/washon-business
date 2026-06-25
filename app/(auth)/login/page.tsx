'use client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()

  const handleLogin = async (provider: 'kakao' | 'google' | 'naver') => {
    await login(provider)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary-50 to-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">💧</div>
          <h1 className="text-xl font-bold text-washon">WashOn Business</h1>
          <p className="text-sm text-gray-500 mt-1">세차장 사장님 관리자</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
          <Button
            className="w-full bg-[#FEE500] text-[#191919] hover:opacity-90"
            onClick={() => handleLogin('kakao')}
            disabled={isLoading}
          >
            카카오로 시작하기
          </Button>
          <Button className="w-full" variant="secondary" onClick={() => handleLogin('google')} disabled={isLoading}>
            Google로 시작하기
          </Button>
          <Button className="w-full" variant="secondary" onClick={() => handleLogin('naver')} disabled={isLoading}>
            네이버로 시작하기
          </Button>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-6">
          로그인 시 업체 등록 및 승인 상태에 따라 온보딩으로 이동합니다.
        </p>
      </div>
    </div>
  )
}
