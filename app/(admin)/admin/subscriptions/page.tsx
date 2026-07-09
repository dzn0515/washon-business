'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import {
  fetchAdminSubscriptions,
  updateAdminSubscriptionPlan,
  type AdminSubscriptionItem,
  type AdminSubscriptionPlanTier,
} from '@/lib/admin-api'

const PLAN_OPTIONS: { key: 'all' | AdminSubscriptionPlanTier; label: string }[] = [
  { key: 'all', label: '전체 플랜' },
  { key: 'BASIC', label: 'Basic' },
  { key: 'STANDARD', label: 'Standard' },
  { key: 'PREMIUM', label: 'Premium' },
]

const STATUS_OPTIONS: { key: string; label: string }[] = [
  { key: 'all', label: '전체 상태' },
  { key: 'free_trial', label: '무료체험' },
  { key: 'active', label: '이용중' },
  { key: 'pending', label: '승인대기' },
  { key: 'suspended', label: '정지' },
  { key: 'inactive', label: '비활성' },
]

const PLAN_LABEL: Record<string, string> = {
  BASIC: 'Basic',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
}

const STATUS_LABEL: Record<string, string> = {
  free_trial: '무료체험',
  active: '이용중',
  pending: '승인대기',
  suspended: '정지',
  inactive: '비활성',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  free_trial: 'info',
  active: 'success',
  pending: 'warning',
  suspended: 'error',
  inactive: 'neutral',
}

function won(n: number) {
  return `${n.toLocaleString()}원`
}

function formatDate(iso: string) {
  if (!iso) return '-'
  return iso.slice(0, 10)
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
  const [nextPlan, setNextPlan] = useState<AdminSubscriptionPlanTier>('BASIC')
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

  const openDetail = (row: AdminSubscriptionItem) => {
    setDetail(row)
    setNextPlan((row.planTier as AdminSubscriptionPlanTier) || 'BASIC')
    setReason('')
  }

  const onChangePlan = async () => {
    if (!detail) return
    if (nextPlan === detail.planTier) {
      showToast('동일한 플랜입니다.', 'warning')
      return
    }
    setProcessing(true)
    try {
      const result = await updateAdminSubscriptionPlan(detail.partnerId, nextPlan, reason)
      showToast(result.message || '플랜이 변경되었습니다.', 'success')
      setDetail(null)
      await load()
    } catch {
      showToast('플랜 변경에 실패했습니다.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="구독 관리"
        description="업체별 요금제(plan_tier) 조회 및 변경 · VAT 별도"
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
            {STATUS_OPTIONS.map((o) => (
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
              { key: 'monthlyFee', label: '월 구독료' },
              { key: 'fee', label: '플랫폼 수수료' },
              { key: 'status', label: '상태' },
              { key: 'createdAt', label: '가입일' },
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
              plan: PLAN_LABEL[row.planTier] ?? row.planTier,
              monthlyFee: won(row.monthlyFee),
              fee: `${row.platformFeeRate}%`,
              status: (
                <AdminBadge
                  label={STATUS_LABEL[row.status] ?? row.status}
                  variant={STATUS_VARIANT[row.status] ?? 'neutral'}
                />
              ),
              createdAt: formatDate(row.createdAt),
              actions: (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    openDetail(row)
                  }}
                  className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                >
                  플랜 변경
                </button>
              ),
            }))}
            emptyMessage="구독 업체가 없습니다."
            onRowClick={(row) => {
              const found = items.find((i) => String(i.partnerId) === row.id)
              if (found) openDetail(found)
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

      <AdminModal open={!!detail} onClose={() => setDetail(null)} title="플랜 변경" size="md">
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-gray-900">{detail.businessName}</p>
              <p className="text-gray-600 mt-1">
                {detail.ownerName ?? '-'} · {detail.phone ?? '-'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                현재 {PLAN_LABEL[detail.planTier] ?? detail.planTier} · {won(detail.monthlyFee)} ·
                수수료 {detail.platformFeeRate}%
                {detail.isFreeTrial ? ' · 무료체험 중' : ''}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-400">변경 플랜</label>
              <select
                value={nextPlan}
                onChange={(e) => setNextPlan(e.target.value as AdminSubscriptionPlanTier)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              >
                {PLAN_OPTIONS.filter((o) => o.key !== 'all').map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">변경 사유</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="감사 로그에 기록됩니다"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none"
              />
            </div>
            <button
              type="button"
              disabled={processing}
              onClick={onChangePlan}
              className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? '처리 중...' : '플랜 변경'}
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  )
}
