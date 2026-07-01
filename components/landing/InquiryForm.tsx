'use client'

import Link from 'next/link'
import { useState } from 'react'
import { submitInquiry, type InquiryData } from '@/lib/submitInquiry'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export default function InquiryForm() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [form, setForm] = useState({
    bizName: '',
    ownerName: '',
    phone: '',
    region: '',
    address: '',
    bizType: '',
    message: '',
    privacyAgreed: false,
  })

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.privacyAgreed) return

    setStatus('loading')
    const payload = {
      bizName: form.bizName,
      ownerName: form.ownerName,
      phone: form.phone,
      region: form.region,
      address: form.address || undefined,
      bizType: form.bizType,
      message: form.message || undefined,
      privacyAgreed: form.privacyAgreed,
    } satisfies InquiryData & { bizType: string }

    try {
      await submitInquiry(payload as InquiryData)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-xl mx-auto text-center py-8">
        <p className="text-lg text-gray-800 leading-relaxed">
          입점 문의가 접수되었습니다. 담당자가 1~2 영업일 내 연락드리겠습니다.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
      {status === 'error' ? (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}

      <div>
        <label htmlFor="bizName" className="block text-sm font-medium text-gray-700 mb-1">
          업체명 <span className="text-red-500">*</span>
        </label>
        <input
          id="bizName"
          type="text"
          required
          value={form.bizName}
          onChange={(e) => update('bizName', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">
          대표자명 <span className="text-red-500">*</span>
        </label>
        <input
          id="ownerName"
          type="text"
          required
          value={form.ownerName}
          onChange={(e) => update('ownerName', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          연락처 <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          required
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
          지역 <span className="text-red-500">*</span>
        </label>
        <input
          id="region"
          type="text"
          required
          placeholder="예: 서울 강남구"
          value={form.region}
          onChange={(e) => update('region', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          매장 주소
        </label>
        <input
          id="address"
          type="text"
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label htmlFor="bizType" className="block text-sm font-medium text-gray-700 mb-1">
          매장 유형 <span className="text-red-500">*</span>
        </label>
        <select
          id="bizType"
          required
          value={form.bizType}
          onChange={(e) => update('bizType', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 bg-white"
        >
          <option value="">매장 유형 선택</option>
          <option value="wash">세차 (손세차·자동세차·셀프세차)</option>
          <option value="dent">덴트·복원</option>
          <option value="tire">타이어</option>
          <option value="detailing">디테일링·광택·유리막</option>
          <option value="battery">배터리 교체</option>
          <option value="glass">유리복원·썬팅·랩핑</option>
          <option value="electronics">블랙박스·네비·카오디오</option>
          <option value="oil">오일교환·경정비·카센터</option>
          <option value="etc">기타</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          희망 상담 내용
        </label>
        <textarea
          id="message"
          rows={4}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 resize-none"
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          id="privacyAgreed"
          type="checkbox"
          required
          checked={form.privacyAgreed}
          onChange={(e) => update('privacyAgreed', e.target.checked)}
          className="mt-1"
        />
        <label htmlFor="privacyAgreed" className="text-sm text-gray-600">
          <Link href="/privacy" target="_blank" className="text-blue-600 underline">
            개인정보 수집 및 이용
          </Link>
          에 동의합니다 <span className="text-red-500">*</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
      >
        {status === 'loading' ? '제출 중...' : '입점 문의 제출'}
      </button>
    </form>
  )
}
