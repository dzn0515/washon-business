'use client'

import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BUSINESS_TYPES } from '@/lib/business-types'
import { embedDaumPostcode } from '@/lib/postcode'
import { submitInquiry } from '@/lib/submitInquiry'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export default function InquiryForm() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [postcodeOpen, setPostcodeOpen] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    bizName: '',
    ownerName: '',
    phone: '',
    zipcode: '',
    roadAddress: '',
    jibunAddress: '',
    detailAddress: '',
    bizType: '',
    message: '',
    privacyAgreed: false,
  })

  const postcodeHostRef = useRef<HTMLDivElement>(null)
  const detailAddressRef = useRef<HTMLInputElement>(null)

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (!postcodeOpen || !postcodeHostRef.current) return

    let cancelled = false
    void (async () => {
      try {
        await embedDaumPostcode(
          postcodeHostRef.current!,
          (data) => {
            if (cancelled) return
            const baseAddress = (data.roadAddress || data.jibunAddress || '').trim()
            setForm((prev) => ({
              ...prev,
              zipcode: data.zonecode,
              roadAddress: baseAddress,
              jibunAddress: (data.jibunAddress || '').trim(),
            }))
            setPostcodeOpen(false)
            setErrorMessage(null)
            requestAnimationFrame(() => {
              detailAddressRef.current?.focus()
            })
          },
          () => {
            if (!cancelled) setPostcodeOpen(false)
          },
        )
      } catch (e) {
        if (cancelled) return
        setPostcodeOpen(false)
        setStatus('error')
        setErrorMessage(e instanceof Error ? e.message : '주소 검색을 시작하지 못했습니다.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [postcodeOpen])

  useEffect(() => {
    if (!postcodeOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPostcodeOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [postcodeOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.privacyAgreed) return
    if (form.password !== form.passwordConfirm) {
      setStatus('error')
      setErrorMessage('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!form.roadAddress.trim()) {
      setStatus('error')
      setErrorMessage('주소를 먼저 검색해 주세요')
      return
    }
    if (!form.detailAddress.trim()) {
      setStatus('error')
      setErrorMessage('상세주소를 입력해 주세요')
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
        zipcode: form.zipcode,
        roadAddress: form.roadAddress,
        jibunAddress: form.jibunAddress,
        detailAddress: form.detailAddress,
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
    <>
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

        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">
                우편번호 <span className="text-red-500">*</span>
              </label>
              <input
                id="zipcode"
                type="text"
                readOnly
                value={form.zipcode}
                placeholder="주소 검색 시 자동 입력"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-700"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null)
                setPostcodeOpen(true)
              }}
              className="shrink-0 inline-flex items-center gap-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Search size={16} />
              주소 검색
            </button>
          </div>

          <div>
            <label htmlFor="roadAddress" className="block text-sm font-medium text-gray-700 mb-1">
              기본주소 <span className="text-red-500">*</span>
            </label>
            <input
              id="roadAddress"
              type="text"
              readOnly
              required
              value={form.roadAddress}
              placeholder="도로명주소를 검색해 주세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-700"
            />
          </div>

          <div>
            <label htmlFor="jibunAddress" className="block text-sm font-medium text-gray-700 mb-1">
              지번주소
            </label>
            <input
              id="jibunAddress"
              type="text"
              readOnly
              value={form.jibunAddress}
              placeholder="주소 검색 시 자동 입력"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-700"
            />
          </div>

          <div>
            <label htmlFor="detailAddress" className="block text-sm font-medium text-gray-700 mb-1">
              상세주소 <span className="text-red-500">*</span>
            </label>
            <input
              id="detailAddress"
              ref={detailAddressRef}
              type="text"
              value={form.detailAddress}
              onChange={(e) => update('detailAddress', e.target.value)}
              placeholder="상세주소를 입력해 주세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
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
          <p className="mt-1 text-xs text-gray-400">
            상담 내용은 현재 저장되지 않습니다. 필요 시 승인 후 연락으로 전달해 주세요.
          </p>
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
          사업자등록번호까지 입력하려면{' '}
          <Link href="/register" className="text-blue-600 underline">
            사장님 상세 가입
          </Link>
          을 이용하세요.
        </p>
      </form>

      {postcodeOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="주소 검색"
            className="flex h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:h-[70vh] sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">주소 검색</p>
              <button
                type="button"
                onClick={() => setPostcodeOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50"
                aria-label="주소 검색 닫기"
              >
                <X size={18} />
              </button>
            </div>
            <div ref={postcodeHostRef} className="min-h-0 flex-1" />
          </div>
        </div>
      ) : null}
    </>
  )
}
