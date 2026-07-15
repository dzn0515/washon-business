'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { getStoredPortal, homeForPortal, isCrmPortal } from '@/lib/portal'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('새 비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const portal = getStoredPortal()
      if (isCrmPortal(portal)) {
        router.replace(homeForPortal(portal))
      } else {
        router.replace('/login')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-slate-900">비밀번호 변경</h1>
        <p className="text-sm text-slate-500">보안을 위해 새 비밀번호로 변경해 주세요.</p>
        <input
          type="password"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="현재 비밀번호"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="새 비밀번호"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#1A6DFF] px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  )
}
