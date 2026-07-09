'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import {
  fetchAdminSubscriptionDetail,
  fetchAdminSubscriptions,
  terminateAdminSubscription,
  updateAdminSubscriptionAutoRenewal,
  updateAdminSubscriptionMemo,
  updateAdminSubscriptionPlan,
  updateAdminSubscriptionStatus,
  updateAdminSubscriptionTrial,
  type AdminSubscriptionItem,
  type AdminSubscriptionPlanTier,
} from '@/lib/admin-api'
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS_LABEL,
  type SubscriptionPlanId,
  type SubscriptionStatus,
} from '@/lib/billing/catalog'
import {
  ADMIN_PAYMENT_STATUS_LABEL,
  type AdminSubscriptionPaymentStatus,
} from '@/lib/subscriptions/types'
import { formatBillingDate, planName } from '@/lib/subscriptions/utils'

const PLAN_OPTIONS: { key: 'all' | AdminSubscriptionPlanTier; label: string }[] = [
  { key: 'all', label: '전체 플랜' },
  { key: 'BASIC', label: 'Basic' },
  { key: 'STANDARD', label: 'Standard' },
  { key: 'PREMIUM', label: 'Premium' },
]

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: '전체 상태' },
  { key: 'FREE_TRIAL', label: '무료체험' },
  { key: 'ACTIVE', label: '이용중' },
  { key: 'EXPIRING', label: '만료예정' },
  { key: 'EXPIRED', label: '만료' },
  { key: 'PAYMENT_FAILED', label: '결제실패' },
  { key: 'CANCELLED', label: '해지' },
  { key: 'TERMINATED', label: '강제종료' },
]

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  FREE_TRIAL: 'info',
  ACTIVE: 'success',
  EXPIRING: 'warning',
  EXPIRED: 'neutral',
  PAYMENT_FAILED: 'error',
  CANCELLED: 'neutral',
  TERMINATED: 'error',
  free_trial: 'info',
  active: 'success',
  payment_pending: 'warning',
  expiring: 'warning',
  expired: 'neutral',
  pending: 'info',
  payment_failed: 'error',
  cancelled: 'neutral',
  terminated: 'error',
}

const PAYMENT_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  NONE: 'neutral',
  OVERDUE: 'error',
  paid: 'success',
  pending: 'warning',
  failed: 'error',
  none: 'neutral',
  overdue: 'error',
}

const PLAN_ID_TO_TIER: Record<SubscriptionPlanId, AdminSubscriptionPlanTier> = {
  basic: 'BASIC',
  standard: 'STANDARD',
  premium: 'PREMIUM',
}

const TIER_TO_PLAN_ID: Record<string, SubscriptionPlanId> = {
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium',
}

const UI_STATUS_TO_API: Record<SubscriptionStatus, string> = {
  free_trial: 'FREE_TRIAL',
  active: 'ACTIVE',
  payment_pending: 'EXPIRING',
  expiring: 'EXPIRING',
  expired: 'EXPIRED',
  pending: 'FREE_TRIAL',
  payment_failed: 'PAYMENT_FAILED',
  cancelled: 'CANCELLED',
  terminated: 'TERMINATED',
}

function statusLabel(status: string): string {
  const lower = status.toLowerCase() as SubscriptionStatus
  if (lower in SUBSCRIPTION_STATUS_LABEL) {
    return SUBSCRIPTION_STATUS_LABEL[lower]
  }
  const mapped = STATUS_FILTERS.find((s) => s.key === status)
  return mapped?.label ?? status
}

function paymentLabel(paymentStatus: string): string {
  const key = paymentStatus.toLowerCase() as AdminSubscriptionPaymentStatus
  return ADMIN_PAYMENT_STATUS_LABEL[key] ?? paymentStatus
}

function dateOnly(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function eventTypeLabel(eventType: string): string {
  const map: Record<string, string> = {
    PLAN_CHANGED: '플랜 변경',
    TRIAL_EXTENDED: '체험 연장',
    STATUS_CHANGED: '상태 변경',
    TERMINATED: '강제 종료',
    MEMO_UPDATED: '메모 수정',
    AUTO_RENEWAL_CHANGED: '자동 갱신',
  }
  return map[eventType] ?? eventType
}

export default function AdminSubscriptionsPage() {
  const { showToast, ToastComponent } = useToast()
  const [items, setItems] = useState<AdminSubscriptionItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [planTier, setPlanTier] = useState('all')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [detail, setDetail] = useState<AdminSubscriptionItem | null>(null)
  const [adminMemo, setAdminMemo] = useState('')
  const [changePlanId, setChangePlanId] = useState<SubscriptionPlanId>('basic')
  const [changeStatus, setChangeStatus] = useState<SubscriptionStatus>('active')
  const [extendDays, setExtendDays] = useState('30')
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdminSubscriptions({
        keyword,
        planTier,
        status,
        page,
        pageSize,
      })
      setItems(data.items)
      setTotal(data.total)
    } catch {
      setError(true)
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [keyword, planTier, status, page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const openDetail = async (row: AdminSubscriptionItem) => {
    setDetail(row)
    setAdminMemo(row.adminMemo ?? '')
    setChangePlanId(TIER_TO_PLAN_ID[row.planTier] ?? 'basic')
    setChangeStatus((row.status.toLowerCase() as SubscriptionStatus) || 'active')
    setExtendDays('30')
    setReason('')
    try {
      const full = await fetchAdminSubscriptionDetail(row.partnerId)
      setDetail(full)
      setAdminMemo(full.adminMemo ?? '')
      setChangePlanId(TIER_TO_PLAN_ID[full.planTier] ?? 'basic')
      setChangeStatus((full.status.toLowerCase() as SubscriptionStatus) || 'active')
    } catch {
      showToast('상세 정보를 불러오지 못했습니다.', 'error')
    }
  }

  const applyUpdated = (updated: AdminSubscriptionItem) => {
    setDetail(updated)
    setAdminMemo(updated.adminMemo ?? '')
    setItems((prev) =>
      prev.map((item) => (item.partnerId === updated.partnerId ? { ...item, ...updated } : item)),
    )
  }

  const onChangePlan = async () => {
    if (!detail) return
    const nextTier = PLAN_ID_TO_TIER[changePlanId]
    if (nextTier === detail.planTier) {
      showToast('동일한 플랜입니다.', 'warning')
      return
    }
    setProcessing(true)
    try {
      const result = await updateAdminSubscriptionPlan(detail.partnerId, nextTier, reason)
      showToast(result.message || '플랜이 변경되었습니다.', 'success')
      applyUpdated(result.subscription)
      setReason('')
      await load()
    } catch {
      showToast('플랜 변경에 실패했습니다.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const onExtendTrial = async () => {
    if (!detail) return
    const days = Number(extendDays) || 30
    const base = dateOnly(detail.trialEndsAt) || new Date().toISOString().slice(0, 10)
    const trialEndsAt = addDaysIso(base, days)
    setProcessing(true)
    try {
      const result = await updateAdminSubscriptionTrial(
        detail.partnerId,
        trialEndsAt,
        reason || `무료 기간 ${days}일 연장`,
      )
      showToast(result.message || '무료 체험이 연장되었습니다.', 'success')
      applyUpdated(result.subscription)
      setReason('')
      await load()
    } catch {
      showToast('무료 체험 연장에 실패했습니다.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const onChangeStatus = async () => {
    if (!detail) return
    const apiStatus = UI_STATUS_TO_API[changeStatus] ?? changeStatus.toUpperCase()
    setProcessing(true)
    try {
      const result = await updateAdminSubscriptionStatus(detail.partnerId, apiStatus, reason)
      showToast(result.message || '상태가 변경되었습니다.', 'success')
      applyUpdated(result.subscription)
      setReason('')
      await load()
    } catch {
      showToast('상태 변경에 실패했습니다.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const onTerminate = async () => {
    if (!detail) return
    if (!window.confirm('구독을 강제 종료하시겠습니까?')) return
    setProcessing(true)
    try {
      const result = await terminateAdminSubscription(detail.partnerId, reason || '관리자 강제 종료')
      showToast(result.message || '구독이 강제 종료되었습니다.', 'success')
      applyUpdated(result.subscription)
      setReason('')
      await load()
    } catch {
      showToast('강제 종료에 실패했습니다.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const onSaveMemo = async () => {
    if (!detail) return
    setProcessing(true)
    try {
      const result = await updateAdminSubscriptionMemo(detail.partnerId, adminMemo)
      showToast(result.message || '메모가 저장되었습니다.', 'success')
      applyUpdated(result.subscription)
    } catch {
      showToast('메모 저장에 실패했습니다.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const onToggleAutoRenewal = async () => {
    if (!detail) return
    setProcessing(true)
    try {
      const result = await updateAdminSubscriptionAutoRenewal(
        detail.partnerId,
        !detail.autoRenewal,
      )
      showToast(result.message || '자동 갱신이 변경되었습니다.', 'success')
      applyUpdated(result.subscription)
      await load()
    } catch {
      showToast('자동 갱신 변경에 실패했습니다.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="구독 관리"
        description="업체별 요금제·구독 상태 조회 및 운영 조작 · VAT 별도"
      />

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700">
        Basic 28,000원(수수료 8.9%, 첫 3개월 무료) · Standard 59,000원(6.9%) · Premium 99,000원(4.9%)
      </div>

      <div className="flex flex-wrap gap-2 items-end bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-gray-400 mb-1">검색</label>
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setKeyword(keywordInput)
                setPage(1)
              }
            }}
            placeholder="업체명, 사장명, 연락처"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">플랜</label>
          <select
            value={planTier}
            onChange={(e) => {
              setPlanTier(e.target.value)
              setPage(1)
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm min-w-[120px]"
          >
            {PLAN_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">상태</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm min-w-[120px]"
          >
            {STATUS_FILTERS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            setKeyword(keywordInput)
            setPage(1)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          검색
        </button>
      </div>

      {error ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">구독 목록을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <AdminTable
            loading={loading}
            columns={[
              { key: 'businessName', label: '업체명' },
              { key: 'plan', label: '현재 플랜' },
              { key: 'status', label: '상태' },
              { key: 'trialEnd', label: '무료 종료일' },
              { key: 'nextPayment', label: '다음 결제일' },
              { key: 'autoRenewal', label: '자동 갱신' },
              { key: 'paymentStatus', label: '결제 상태' },
              { key: 'actions', label: '액션', width: '100px' },
            ]}
            data={items.map((row) => ({
              id: String(row.partnerId),
              businessName: (
                <div>
                  <p className="font-medium text-gray-900">{row.businessName}</p>
                  <p className="text-xs text-gray-400">
                    {row.ownerName ?? '-'} · {row.phone ?? '-'}
                  </p>
                </div>
              ),
              plan: planName(TIER_TO_PLAN_ID[row.planTier] ?? 'basic'),
              status: (
                <AdminBadge
                  label={statusLabel(row.status)}
                  variant={STATUS_VARIANT[row.status] ?? 'neutral'}
                />
              ),
              trialEnd: formatBillingDate(dateOnly(row.trialEndsAt) || null),
              nextPayment: formatBillingDate(dateOnly(row.nextPaymentAt) || null),
              autoRenewal: (
                <span
                  className={
                    row.autoRenewal ? 'text-green-600 font-medium' : 'text-gray-400'
                  }
                >
                  {row.autoRenewal ? 'ON' : 'OFF'}
                </span>
              ),
              paymentStatus: (
                <AdminBadge
                  label={paymentLabel(row.paymentStatus)}
                  variant={PAYMENT_VARIANT[row.paymentStatus] ?? 'neutral'}
                />
              ),
              actions: (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    void openDetail(row)
                  }}
                  className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                >
                  상세
                </button>
              ),
            }))}
            emptyMessage="구독 업체가 없습니다."
            onRowClick={(row) => {
              const found = items.find((i) => String(i.partnerId) === row.id)
              if (found) void openDetail(found)
            }}
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              총 {total.toLocaleString()}건 · {page}/{totalPages}페이지
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                이전
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminModal open={!!detail} onClose={() => setDetail(null)} title="구독 상세" size="lg">
        {detail && (
          <div className="space-y-5 text-sm">
            <section>
              <p className="text-xs font-medium text-gray-400 mb-2">업체</p>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900">{detail.businessName}</p>
                <p className="text-gray-600 mt-1">
                  {detail.ownerName ?? '-'} · {detail.phone ?? '-'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {planName(TIER_TO_PLAN_ID[detail.planTier] ?? 'basic')} ·{' '}
                  {detail.monthlyFee.toLocaleString()}원 · 수수료 {detail.platformFeeRate}%
                  {detail.isFreeTrial ? ' · 무료체험 중' : ''}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-400">현재 플랜</p>
                <p className="font-semibold">
                  {planName(TIER_TO_PLAN_ID[detail.planTier] ?? 'basic')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">상태</p>
                <AdminBadge
                  label={statusLabel(detail.status)}
                  variant={STATUS_VARIANT[detail.status] ?? 'neutral'}
                />
              </div>
              <div>
                <p className="text-xs text-gray-400">무료 종료일</p>
                <p>{formatBillingDate(dateOnly(detail.trialEndsAt) || null)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">다음 결제일</p>
                <p>{formatBillingDate(dateOnly(detail.nextPaymentAt) || null)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">자동 갱신</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={
                      detail.autoRenewal ? 'text-green-600 font-medium' : 'text-gray-400'
                    }
                  >
                    {detail.autoRenewal ? 'ON' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={onToggleAutoRenewal}
                    className="px-2 py-0.5 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    변경
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">결제 상태</p>
                <AdminBadge
                  label={paymentLabel(detail.paymentStatus)}
                  variant={PAYMENT_VARIANT[detail.paymentStatus] ?? 'neutral'}
                />
              </div>
            </section>

            <section>
              <p className="text-xs font-medium text-gray-400 mb-1">관리자 메모</p>
              <textarea
                value={adminMemo}
                onChange={(e) => setAdminMemo(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none"
              />
              <button
                type="button"
                disabled={processing}
                onClick={onSaveMemo}
                className="mt-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                메모 저장
              </button>
            </section>

            <section>
              <label className="text-xs text-gray-400">변경 사유 (감사 로그)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="플랜/상태/종료 변경 시 기록됩니다"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none"
              />
            </section>

            <section className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs font-medium text-gray-400">운영 조작</p>

              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-400">플랜 변경</label>
                  <select
                    value={changePlanId}
                    onChange={(e) => setChangePlanId(e.target.value as SubscriptionPlanId)}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  >
                    {SUBSCRIPTION_PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={processing}
                  onClick={onChangePlan}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0"
                >
                  플랜 변경
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-400">무료 기간 연장 (일)</label>
                  <input
                    type="number"
                    min={1}
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <button
                  type="button"
                  disabled={processing}
                  onClick={onExtendTrial}
                  className="px-4 py-2 rounded-xl border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50 disabled:opacity-50 shrink-0"
                >
                  무료 연장
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-400">상태 변경</label>
                  <select
                    value={changeStatus}
                    onChange={(e) => setChangeStatus(e.target.value as SubscriptionStatus)}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  >
                    {(Object.keys(SUBSCRIPTION_STATUS_LABEL) as SubscriptionStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {SUBSCRIPTION_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={processing}
                  onClick={onChangeStatus}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 shrink-0"
                >
                  상태 변경
                </button>
              </div>

              <button
                type="button"
                disabled={processing}
                onClick={onTerminate}
                className="w-full px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                강제 종료
              </button>
            </section>

            {detail.events && detail.events.length > 0 && (
              <section className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-400 mb-2">이벤트 이력</p>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {[...detail.events].reverse().map((ev) => (
                    <li
                      key={ev.id}
                      className="text-xs bg-gray-50 rounded-lg px-3 py-2 text-gray-600"
                    >
                      <span className="font-medium text-gray-800">
                        {eventTypeLabel(ev.eventType)}
                      </span>
                      {ev.reason ? ` · ${ev.reason}` : ''}
                      <span className="block text-gray-400 mt-0.5">
                        {ev.createdAt.slice(0, 16).replace('T', ' ')} · {ev.actorType}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  )
}
