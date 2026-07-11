'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import {
  fetchAdminCouponMetrics,
  fetchAdminCoupons,
  type AdminCouponItem,
  type AdminCouponMetrics,
} from '@/lib/admin-api'
import {
  ADMIN_COUPON_SOURCE_LABEL,
  ADMIN_COUPON_STATUS_LABEL,
  formatAdminCouponDateRange,
  formatAdminCouponDiscount,
  getAdminBizTypeLabel,
} from '@/lib/admin-ui'

const SOURCE_FILTERS = [
  { key: 'all', label: '전체 출처' },
  { key: 'manual', label: '수동' },
  { key: 'birthday_auto', label: '생일자동' },
]

const STATUS_FILTERS = [
  { key: 'all', label: '전체 상태' },
  { key: 'issued', label: '발급' },
  { key: 'used', label: '사용' },
  { key: 'expired', label: '만료' },
  { key: 'cancelled', label: '취소' },
]

const ACTIVE_FILTERS = [
  { key: 'all', label: '전체 활성' },
  { key: 'true', label: '활성' },
  { key: 'false', label: '비활성' },
]

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  issued: 'info',
  used: 'success',
  expired: 'neutral',
  cancelled: 'error',
}

function sourceLabel(source: string): string {
  return ADMIN_COUPON_SOURCE_LABEL[source] ?? source
}

function statusLabel(status: string | null): string {
  if (status == null) return '템플릿'
  return ADMIN_COUPON_STATUS_LABEL[status] ?? status
}

export default function AdminCouponsPage() {
  const [items, setItems] = useState<AdminCouponItem[]>([])
  const [metrics, setMetrics] = useState<AdminCouponMetrics | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [source, setSource] = useState('all')
  const [status, setStatus] = useState('all')
  const [isActive, setIsActive] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [metricsError, setMetricsError] = useState(false)

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true)
    setMetricsError(false)
    try {
      const data = await fetchAdminCouponMetrics({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setMetrics(data)
    } catch {
      setMetricsError(true)
      setMetrics(null)
    } finally {
      setMetricsLoading(false)
    }
  }, [dateFrom, dateTo])

  const loadList = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdminCoupons({
        keyword,
        source,
        status,
        isActive: isActive === 'all' ? 'all' : isActive === 'true',
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
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
  }, [keyword, source, status, isActive, dateFrom, dateTo, page, pageSize])

  const loadAll = useCallback(async () => {
    await Promise.all([loadMetrics(), loadList()])
  }, [loadMetrics, loadList])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const applySearch = () => {
    setKeyword(keywordInput)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="쿠폰 모니터링"
        description="전체 매장 쿠폰 정의·발급·사용 현황 (읽기 전용)"
      />

      {metricsError ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-500 mb-3">집계를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void loadMetrics()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <AdminStatCard
            icon="🎫"
            label="총 쿠폰"
            value={metricsLoading ? '-' : (metrics?.totalCoupons ?? '-')}
            color="blue"
          />
          <AdminStatCard
            icon="✅"
            label="활성"
            value={metricsLoading ? '-' : (metrics?.activeCoupons ?? '-')}
            color="green"
          />
          <AdminStatCard
            icon="📤"
            label="총 발급"
            value={metricsLoading ? '-' : (metrics?.totalIssued ?? '-')}
            color="blue"
          />
          <AdminStatCard
            icon="✔️"
            label="총 사용"
            value={metricsLoading ? '-' : (metrics?.totalUsed ?? '-')}
            color="orange"
          />
          <AdminStatCard
            icon="📈"
            label="사용률"
            value={
              metricsLoading || metrics == null
                ? '-'
                : `${Number(metrics.usageRate).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}%`
            }
            color="green"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-end bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-gray-400 mb-1">검색</label>
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch()
            }}
            placeholder="쿠폰명, 매장명"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">출처</label>
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value)
              setPage(1)
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm min-w-[120px]"
          >
            {SOURCE_FILTERS.map((o) => (
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
        <div>
          <label className="block text-xs text-gray-400 mb-1">활성</label>
          <select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value)
              setPage(1)
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm min-w-[110px]"
          >
            {ACTIVE_FILTERS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">시작일</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">종료일</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={applySearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          검색
        </button>
      </div>

      {error ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">쿠폰 목록을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void loadList()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <AdminTable
            loading={loading}
            emptyMessage="등록된 쿠폰이 없습니다."
            columns={[
              { key: 'businessName', label: '매장' },
              { key: 'name', label: '쿠폰명' },
              { key: 'discount', label: '할인' },
              { key: 'minOrder', label: '최소주문' },
              { key: 'period', label: '유효기간' },
              { key: 'source', label: '출처' },
              { key: 'status', label: '상태' },
              { key: 'counts', label: '발급/사용' },
              { key: 'active', label: '활성' },
            ]}
            data={items.map((row) => ({
              businessName: (
                <div>
                  <p className="font-medium text-gray-900">{row.businessName}</p>
                  <p className="text-xs text-gray-400">
                    {row.bizType ? getAdminBizTypeLabel(row.bizType) : '-'}
                  </p>
                </div>
              ),
              name: <span className="text-gray-900">{row.name}</span>,
              discount: formatAdminCouponDiscount(row.discountType, row.discountValue),
              minOrder:
                row.minOrderAmount > 0
                  ? `${row.minOrderAmount.toLocaleString('ko-KR')}원`
                  : '-',
              period: (
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {formatAdminCouponDateRange(row.validFrom, row.validUntil)}
                </span>
              ),
              source: <AdminBadge variant="neutral" label={sourceLabel(row.source)} />,
              status: (
                <AdminBadge
                  variant={row.status ? STATUS_VARIANT[row.status] ?? 'neutral' : 'info'}
                  label={statusLabel(row.status)}
                />
              ),
              counts: (
                <span className="tabular-nums">
                  {row.issuedCount} / {row.usedCount}
                </span>
              ),
              active: (
                <AdminBadge
                  variant={row.isActive ? 'success' : 'neutral'}
                  label={row.isActive ? '활성' : '비활성'}
                />
              ),
            }))}
          />

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              총 {total.toLocaleString('ko-KR')}건 · {page}/{totalPages} 페이지
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                이전
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
