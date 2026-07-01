'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, setAccessToken } from '@/lib/api-client'
import { setToken, clearToken } from '@/lib/auth'
import { isAdminRole, setMockRole, persistAdminUser } from '@/lib/admin-auth'

export default function AdminLoginPage() {
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
      const role = data.user?.role ?? data.role ?? ''
      const userId = data.user?.id ?? data.user_id ?? ''

      if (!isAdminRole(email, role)) {
        setAccessToken(null)
        clearToken()
        setError('관리자 권한이 없습니다.')
        return
      }

      setToken(data.access_token)
      setMockRole('admin')
      persistAdminUser({
        id: String(userId),
        email,
        name: data.user?.name,
        role: role || 'admin',
      })

      router.push('/admin/dashboard')
    } catch (err) {
      const status = (err as Error & { status?: number }).status
      if (status === 401) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else if (status === 403) {
        setError('관리자 권한이 없습니다.')
      } else {
        setError('서버 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">AUTOON</h1>
          <p className="text-slate-400 text-sm mt-2">관리자 전용 로그인</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Admin 로그인</h2>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@autoon.kr"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-2"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-6">
            관리자 계정이 필요하면 시스템 담당자에게 문의하세요.
          </p>
        </div>
      </div>
    </div>
  )
}
