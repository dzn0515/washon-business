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
        address: form.address.trim(),
        bizType: form.bizType,
        memo: form.memo.trim() || null,
      })
      setSuccess(res.message || '입점 신청이 접수되었습니다.')
      setTimeout(() => {
        router.push('/sales/leads')
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
        <p className="mt-1 text-sm text-stone-500">
          업체를 신청하면 관리자 승인 후 Partner가 생성되고 나에게 배정됩니다.
        </p>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">업체명 *</label>
          <input className={inputClass} required value={form.businessName} onChange={set('businessName')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">대표자명 *</label>
          <input className={inputClass} required value={form.ownerName} onChange={set('ownerName')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">이메일 *</label>
          <input
            type="email"
            className={inputClass}
            required
            autoComplete="off"
            value={form.email}
            onChange={set('email')}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">연락처 *</label>
          <input className={inputClass} required value={form.phone} onChange={set('phone')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">주소</label>
          <input className={inputClass} value={form.address} onChange={set('address')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">업종</label>
          <select className={inputClass} value={form.bizType} onChange={set('bizType')}>
            {BIZ_TYPES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">메모</label>
          <textarea className={inputClass} rows={3} value={form.memo} onChange={set('memo')} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          {loading ? '신청 중...' : '입점 신청'}
        </button>
      </form>
    </div>
  )
}
