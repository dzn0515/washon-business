'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearAuthSession, login } from '@/lib/api-client'
import { homeForPortal, setStoredPortal } from '@/lib/portal'

export default function SalesLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(email, password)
      if (data.portal !== 'SALES') {
        clearAuthSession()
        setError('영업사원 권한이 없습니다.')
        return
      }
      setStoredPortal('SALES')
      if (data.passwordResetRequired) {
        router.replace('/change-password')
        return
      }
      router.replace(homeForPortal('SALES'))
    } catch (err) {
      const status = (err as Error & { status?: number }).status
      if (status === 401) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else if (status === 403) {
        setError('영업사원 권한이 없습니다.')
      } else {
        setError(err instanceof Error ? err.message : '서버 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">AUTOON Sales</h1>
          <p className="mt-2 text-sm text-teal-200/80">영업사원 전용 로그인</p>
          <p className="mt-1 text-xs text-teal-300/70">통합 로그인: /login 도 사용 가능합니다</p>
        </div>
        <form
          onSubmit={handleLogin}
          className="space-y-3 rounded-2xl border border-teal-700/50 bg-teal-950/50 p-6"
        >
          <input
            type="email"
            className="w-full rounded-lg border border-teal-800 bg-teal-950 px-3 py-2 text-sm text-white"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full rounded-lg border border-teal-800 bg-teal-950 px-3 py-2 text-sm text-white"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
