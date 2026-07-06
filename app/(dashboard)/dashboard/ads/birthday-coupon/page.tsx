'use client'

import Link from 'next/link'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import AutomationSettingCard from '@/components/ads/AutomationSettingCard'
import MetricCard from '@/components/ads/MetricCard'
import StatusBadge from '@/components/ads/StatusBadge'
import {
  fetchBirthdayCouponIssuances,
  fetchBirthdayCouponMetrics,
  fetchBirthdayCouponSettings,
  saveBirthdayCouponSettings,
  type BirthdayCouponSettings,
  type BirthdayCouponSettingsPayload,
} from '@/lib/birthday-coupon-api'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { fetchBusinessMe } from '@/lib/store-api'

const VALIDITY_OPTIONS = [7, 14, 30, 60] as const

type FormState = {
  discount_type: 'amount' | 'percent'
  discount_value: number
  validity_days: number
  min_order_amount: string
}

const EMPTY_FORM: FormState = {
  discount_type: 'amount',
  discount_value: 5000,
  validity_days: 30,
  min_order_amount: '',
}

function validateForm(form: FormState): string | null {
  if (form.discount_type === 'amount') {
    if (form.discount_value < 1000) return '정액 할인은 최소 1,000원입니다'
    if (form.discount_value % 1000 !== 0) return '정액 할인은 1,000원 단위입니다'
  } else if (form.discount_value > 50) {
    return '정률 할인은 최대 50%입니다'
  }
  if (!VALIDITY_OPTIONS.includes(form.validity_days as (typeof VALIDITY_OPTIONS)[number])) {
    return '유효기간을 선택해 주세요'
  }
  return null
}

function settingsToForm(settings: BirthdayCouponSettings | null): FormState {
  if (!settings) return { ...EMPTY_FORM }
  return {
    discount_type: settings.discount_type,
    discount_value: settings.discount_value,
    validity_days: settings.validity_days,
    min_order_amount:
      settings.min_order_amount != null && settings.min_order_amount > 0
        ? String(settings.min_order_amount)
        : '',
  }
}

function formToPayload(form: FormState): BirthdayCouponSettingsPayload {
  const minRaw = form.min_order_amount.trim()
  return {
    discount_type: form.discount_type,
    discount_value: form.discount_value,
    validity_days: form.validity_days,
    min_order_amount: minRaw ? Number(minRaw) : null,
  }
}

function discountLabel(form: FormState): string {
  if (form.discount_type === 'amount') return `${form.discount_value.toLocaleString()}원`
  return `${form.discount_value}%`
}

function minOrderSuffix(form: FormState): string {
  const minRaw = form.min_order_amount.trim()
  if (!minRaw) return ''
  const n = Number(minRaw)
  if (!Number.isFinite(n) || n <= 0) return ''
  return ` (최소 ${n.toLocaleString()}원 이상)`
}

const PushPreviewCard = memo(function PushPreviewCard({
  businessName,
  form,
}: {
  businessName: string
  form: FormState
}) {
  const debounced = useDebouncedValue(form, 250)
  const text = `🎂 생일 축하드려요! ${businessName}에서 ${discountLabel(debounced)} 할인 쿠폰이 도착했어요${minOrderSuffix(debounced)} · D-${debounced.validity_days}`
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-gray-800">
      <p className="mb-1 text-xs font-medium text-blue-700">푸시 미리보기</p>
      <p className="leading-relaxed">{text}</p>
    </div>
  )
})

const STATUS_LABEL: Record<string, string> = {
  issued: '발급됨',
  used: '사용됨',
  expired: '만료',
  cancelled: '취소',
}

export default function BirthdayCouponSettingsPage() {
  const [businessName, setBusinessName] = useState('우리 매장')
  const [savedForm, setSavedForm] = useState<FormState>(EMPTY_FORM)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [metrics, setMetrics] = useState({ issued: 0, used: 0, rate: 0 })
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [page, setPage] = useState(1)
  const [issuances, setIssuances] = useState<
    Awaited<ReturnType<typeof fetchBirthdayCouponIssuances>> | null
  >(null)

  const validationError = useMemo(() => validateForm(form), [form])
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedForm), [form, savedForm])

  const load = useCallback(async () => {
    try {
      const [me, settings, m] = await Promise.all([
        fetchBusinessMe(),
        fetchBirthdayCouponSettings(),
        fetchBirthdayCouponMetrics(),
      ])
      setBusinessName(me.name)
      const nextForm = settingsToForm(settings)
      setForm(nextForm)
      setSavedForm(nextForm)
      setMetrics({
        issued: m.issued_this_month,
        used: m.used_this_month,
        rate: m.usage_rate_pct,
      })
    } catch {
      setError('설정을 불러오지 못했습니다.')
    }
  }, [])

  const loadIssuances = useCallback(async () => {
    try {
      const data = await fetchBirthdayCouponIssuances({ month, page, page_size: 20 })
      setIssuances(data)
    } catch {
      setIssuances({ items: [], total: 0, page: 1, page_size: 20 })
    }
  }, [month, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadIssuances()
  }, [loadIssuances])

  const handleSave = async () => {
    if (validationError) return
    setSaving(true)
    setSaveError(null)
    try {
      await saveBirthdayCouponSettings(formToPayload(form))
      setSavedForm(form)
      setToast('쿠폰 설정이 저장되었습니다.')
      setTimeout(() => setToast(null), 2500)
      await load()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = issuances ? Math.max(1, Math.ceil(issuances.total / issuances.page_size)) : 1

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold text-gray-900">생일 쿠폰 설정</h1>
        <StatusBadge status="active" billingType="monthly" />
        <Link href="/dashboard/ads" className="ml-auto text-sm text-blue-600 hover:underline">
          ← 앱 노출 관리
        </Link>
      </div>

      {dirty ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          쿠폰 설정을 저장하기 전에는 발급되지 않아요
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {toast ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="이번 달 발급" value={`${metrics.issued}건`} />
        <MetricCard label="사용" value={`${metrics.used}건`} />
        <MetricCard label="사용률" value={`${metrics.rate}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <AutomationSettingCard title="할인 유형" description="정액 또는 정률 중 하나">
          <div className="flex gap-2">
            {(['amount', 'percent'] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                  form.discount_type === type
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    discount_type: type,
                    discount_value: type === 'amount' ? 5000 : 10,
                  }))
                }
              >
                {type === 'amount' ? '정액(원)' : '정률(%)'}
              </button>
            ))}
          </div>
        </AutomationSettingCard>

        <AutomationSettingCard
          title="할인 값"
          error={validationError}
          description={
            form.discount_type === 'amount' ? '1,000원 단위 · 최소 1,000원' : '최대 50%'
          }
        >
          <input
            type="number"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={form.discount_value}
            onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))}
            min={form.discount_type === 'amount' ? 1000 : 1}
            max={form.discount_type === 'percent' ? 50 : undefined}
            step={form.discount_type === 'amount' ? 1000 : 1}
          />
        </AutomationSettingCard>

        <AutomationSettingCard title="유효기간" description="발급일 기준">
          <div className="flex flex-wrap gap-2">
            {VALIDITY_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  form.validity_days === days
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
                onClick={() => setForm((f) => ({ ...f, validity_days: days }))}
              >
                {days}일
              </button>
            ))}
          </div>
        </AutomationSettingCard>

        <AutomationSettingCard title="최소 주문 금액" description="미입력 시 제한 없음">
          <input
            type="number"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="예: 30000"
            value={form.min_order_amount}
            onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
            min={0}
            step={1000}
          />
        </AutomationSettingCard>
      </div>

      <PushPreviewCard businessName={businessName} form={form} />

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!dirty || !!validationError || saving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? '저장 중…' : '설정 저장'}
        </button>
      </div>
      {saveError ? <p className="text-right text-sm text-red-600">{saveError}</p> : null}

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-900">발급 내역</h2>
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setPage(1)
              setMonth(e.target.value)
            }}
            className="rounded border border-gray-200 px-2 py-1 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-gray-500">
                <th className="py-2 pr-4">발급일</th>
                <th className="py-2 pr-4">고객명</th>
                <th className="py-2 pr-4">쿠폰 내용</th>
                <th className="py-2 pr-4">상태</th>
                <th className="py-2">사용일</th>
              </tr>
            </thead>
            <tbody>
              {(issuances?.items ?? []).map((row) => (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 text-gray-700">
                    {row.issued_at.slice(0, 10)}
                  </td>
                  <td className="py-2 pr-4">{row.customer_name_masked}</td>
                  <td className="py-2 pr-4">{row.coupon_summary}</td>
                  <td className="py-2 pr-4">{STATUS_LABEL[row.status] ?? row.status}</td>
                  <td className="py-2">{row.used_at ? row.used_at.slice(0, 10) : '-'}</td>
                </tr>
              ))}
              {(issuances?.items.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    발급 내역이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            총 {issuances?.total ?? 0}건 · {page}/{totalPages}페이지
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              className="rounded border px-3 py-1 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              className="rounded border px-3 py-1 disabled:opacity-40"
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
