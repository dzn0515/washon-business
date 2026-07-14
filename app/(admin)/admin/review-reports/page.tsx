'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import {
  fetchAdminReviewReports,
  type AdminReviewReportListItem,
} from '@/lib/admin-api'

const PAGE_SIZE = 20

const STATUS_LABEL: Record<string, string> = {
  PENDING: '검토 중',
  DISMISSED: '기각됨',
  ACTIONED: '조치 완료',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error' | 'info'> = {
  PENDING: 'warning',
  DISMISSED: 'neutral',
  ACTIONED: 'success',
}

const REASON_LABEL: Record<string, string> = {
  ABUSE: '욕설·비방',
  PRIVACY: '개인정보 노출',
  SPAM: '스팸·광고',
  FALSE_INFORMATION: '허위 정보',
  INAPPROPRIATE_IMAGE: '부적절한 이미지',
  OTHER: '기타',
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('ko-KR')
}

function excerpt(text: string | null | undefined, max = 60) {
  if (!text) return '-'
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max)}…` : t
}

export default function AdminReviewReportsPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminReviewReportListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [status, setStatus] = useState('all')
  const [reason, setReason] = useState('all')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminReviewReports({
        keyword: keyword || undefined,
        status: status === 'all' ? undefined : status,
        reason: reason === 'all' ? undefined : reason,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(data.items)
      setTotal(data.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : '신고 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [keyword, status, reason, createdFrom, createdTo, page])

  useEffect(() => {
    void load()
  }, [load])

  function handleSearch() {
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  function handleReset() {
    setKeywordInput('')
    setKeyword('')
    setStatus('all')
    setReason('all')
    setCreatedFrom('')
    setCreatedTo('')
    setPage(1)
  }

  return (
    <div className="space-y-4 pb-8">
      <AdminPageHeader
        title="리뷰신고"
        description="고객이 신고한 리뷰를 검토하고 기각 또는 리뷰 숨김 처리합니다."
      />

      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="리뷰 내용 · 업체 · 신고자 검색"
            className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <select
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">전체 상태</option>
            <option value="PENDING">검토 중</option>
            <option value="DISMISSED">기각됨</option>
            <option value="ACTIONED">조치 완료</option>
          </select>
          <select
            value={reason}
            onChange={(e) => {
              setPage(1)
              setReason(e.target.value)
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">전체 사유</option>
            {Object.entries(REASON_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={createdFrom}
            onChange={(e) => {
              setPage(1)
              setCreatedFrom(e.target.value)
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <input
            type="date"
            value={createdTo}
            onChange={(e) => {
              setPage(1)
              setCreatedTo(e.target.value)
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            검색
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
          >
            초기화
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <AdminTable
          loading={loading}
          emptyMessage="신고 내역이 없습니다."
          columns={[
            { key: 'review', label: '리뷰' },
            { key: 'reason', label: '사유', width: '120px' },
            { key: 'partner', label: '업체', width: '130px' },
            { key: 'reporter', label: '신고자', width: '110px' },
            { key: 'reports', label: '누적', width: '60px' },
            { key: 'created', label: '신고일', width: '100px' },
            { key: 'status', label: '상태', width: '90px' },
            { key: 'actions', label: '관리', width: '70px' },
          ]}
          data={items.map((row) => ({
            review: (
              <div>
                <div className="text-sm text-gray-800 line-clamp-2">{excerpt(row.reviewPreview)}</div>
                <div className="text-xs text-gray-400 mt-0.5">리뷰 #{row.reviewId}</div>
              </div>
            ),
            reason: REASON_LABEL[row.reason] ?? row.reason,
            partner: row.partnerName,
            reporter: row.reporterName,
            reports: row.reportCount,
            created: formatDate(row.createdAt),
            status: (
              <AdminBadge
                label={STATUS_LABEL[row.status] ?? row.status}
                variant={STATUS_VARIANT[row.status] ?? 'neutral'}
              />
            ),
            actions: (
              <button
                type="button"
                onClick={() => router.push(`/admin/review-reports/${row.id}`)}
                className="text-xs text-blue-600 underline"
              >
                상세
              </button>
            ),
          }))}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          총 {total}건 · {page}/{totalPages} 페이지
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
          >
            이전
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}
