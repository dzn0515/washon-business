'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { login } from '@/lib/api-client'
import { setMockRole } from '@/lib/admin-auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingMsg, setPendingMsg] = useState<string | null>(null)

  const handleEmailLogin = async () => {
    setError(null)
    setPendingMsg(null)
    setLoading(true)
    try {
      await login(email, password)
      if (email.includes('admin@')) {
        setMockRole('admin')
        router.push('/admin')
      } else {
        setMockRole('owner')
        router.push('/dashboard')
      }
    } catch (e) {
      const err = e as Error & { status?: number }
      const msg = err.message
      if (err.status === 403 && msg.includes('승인 대기')) {
        setPendingMsg('승인 대기 중입니다. 관리자 승인 후 이용 가능합니다.')
        router.push('/pending')
        return
      }
      if (err.status === 403 && msg.includes('거절')) {
        setError('가입이 거절됐습니다. 고객센터에 문의해주세요.')
        return
      }
      setError(msg || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary-50 to-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">💧</div>
          <h1 className="text-xl font-bold text-washon">AUTOON Business</h1>
          <p className="text-sm text-gray-500 mt-1">세차장 사장님 관리자</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full bg-[#1A6DFF]" onClick={handleEmailLogin} disabled={loading}>
            {loading ? '로그인 중...' : '이메일로 로그인'}
          </Button>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          {pendingMsg && <p className="text-sm text-amber-700 text-center bg-amber-50 rounded-lg p-2">{pendingMsg}</p>}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          아직 회원이 아니신가요?{' '}
          <Link href="/register" className="text-[#1A6DFF] font-medium">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
