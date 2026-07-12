'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitSalesApply } from '@/lib/sales-api'

const BIZ_TYPES = [
  { value: 'wash', label: '세차' },
  { value: 'detailing', label: '디테일링' },
  { value: 'tire', label: '타이어' },
  { value: 'etc', label: '기타' },
]

const inputClass =
  'w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

export default function SalesApplyPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    bizType: 'wash',
    memo: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await submitSalesApply({
        businessName: form.businessName.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password.trim() || null,
        address: form.address.trim(),
        bizType: form.bizType,
        memo: form.memo.trim() || null,
      })
      setSuccess(res.message || '입점 신청이 완료되었습니다.')
      setTimeout(() => {
        router.push(`/sales/partners/${res.partnerId}`)
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : '입점 신청에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">입점 신청</h1>
        <p className="mt-1 text-sm text-stone-500">신규 업체를 등록하고 나에게 배정합니다.</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">업체명 *</label>
          <input required value={form.businessName} onChange={set('businessName')} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">대표자명 *</label>
          <input required value={form.ownerName} onChange={set('ownerName')} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">이메일 *</label>
          <input type="email" required value={form.email} onChange={set('email')} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">연락처 *</label>
          <input required value={form.phone} onChange={set('phone')} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">초기 비밀번호</label>
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            minLength={6}
            placeholder="미입력 시 자동 생성될 수 있음"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">주소</label>
          <input value={form.address} onChange={set('address')} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">업종</label>
          <select value={form.bizType} onChange={set('bizType')} className={inputClass}>
            {BIZ_TYPES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">메모</label>
          <textarea value={form.memo} onChange={set('memo')} rows={3} className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
        >
          {loading ? '신청 중...' : '입점 신청'}
        </button>
      </form>
    </div>
  )
}
