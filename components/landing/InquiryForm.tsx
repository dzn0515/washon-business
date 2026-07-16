'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BUSINESS_TYPES } from '@/lib/business-types'
import { submitInquiry } from '@/lib/submitInquiry'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export default function InquiryForm() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
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
    if (form.password !== form.passwordConfirm) {
      setStatus('error')
      setErrorMessage('비밀번호가 일치하지 않습니다.')
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    try {
      await submitInquiry({
        email: form.email,
        password: form.password,
        bizName: form.bizName,
        ownerName: form.ownerName,
        phone: form.phone,
        region: form.region,
        address: form.address || undefined,
        bizType: form.bizType,
        message: form.message || undefined,
        privacyAgreed: form.privacyAgreed,
      })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-xl mx-auto text-center py-8 space-y-3">
        <p className="text-lg text-gray-800 leading-relaxed">
          입점 신청이 접수되었습니다. 관리자 승인 후 로그인해 이용할 수 있습니다.
        </p>
        <p className="text-sm text-gray-500">
          승인 상태는 입력하신 이메일로 안내드리며, 승인 전에는 로그인할 수 없습니다.
        </p>
        <Link href="/login" className="inline-block text-sm font-semibold text-blue-600 underline">
          로그인 페이지로 이동
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
      {status === 'error' ? (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 whitespace-pre-line">
          {errorMessage || '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          로그인 이메일 <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호 <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호 확인 <span className="text-red-500">*</span>
        </label>
        <input
          id="passwordConfirm"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={form.passwordConfirm}
          onChange={(e) => update('passwordConfirm', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

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
          {BUSINESS_TYPES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
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
        {status === 'loading' ? '제출 중...' : '입점 신청 제출'}
      </button>

      <p className="text-center text-xs text-gray-500">
        사업자등록번호·상세 주소까지 입력하려면{' '}
        <Link href="/register" className="text-blue-600 underline">
          사장님 상세 가입
        </Link>
        을 이용하세요.
      </p>
    </form>
  )
}
