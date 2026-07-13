'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearAuthSession, fetchAuthMe, login } from '@/lib/api-client'

export default function DistributorLoginPage() {
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
      await login(email, password)
      const me = await fetchAuthMe()
      const role = me.role.toLowerCase()

      if (role !== 'distributor') {
        clearAuthSession()
        setError('총판 권한이 없습니다.')
        return
      }

      router.push('/distributor')
    } catch (err) {
      const status = (err as Error & { status?: number }).status
      if (status === 401) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else if (status === 403) {
        setError('총판 권한이 없습니다.')
      } else {
        setError(err instanceof Error ? err.message : '서버 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">AUTOON Distributor</h1>
          <p className="mt-2 text-sm text-slate-200/80">총판 전용 로그인</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-xl font-bold text-stone-900">로그인</h2>
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="distributor@autoon.kr"
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
