'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import {
  fetchAdminReviews,
  type AdminReviewListItem,
  type AdminReviewSummary,
} from '@/lib/admin-api'

const PAGE_SIZE = 20

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: '공개',
  HIDDEN: '숨김',
  DELETED: '삭제',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error' | 'info'> = {
  PUBLISHED: 'success',
  HIDDEN: 'warning',
  DELETED: 'neutral',
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('ko-KR')
}

function stars(rating: number) {
  return `${'★'.repeat(rating)}${'☆'.repeat(Math.max(0, 5 - rating))}`
}

function excerpt(text: string | null | undefined, max = 80) {
  if (!text) return '-'
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max)}…` : t
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminReviewListItem[]>([])
  const [summary, setSummary] = useState<AdminReviewSummary | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [status, setStatus] = useState('all')
  const [rating, setRating] = useState('all')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminReviews({
        keyword: keyword || undefined,
        status: status === 'all' ? undefined : status,
        rating: rating === 'all' ? undefined : Number(rating),
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(data.items)
      setSummary(data.summary)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '리뷰 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [keyword, status, rating, createdFrom, createdTo, page])

  useEffect(() => {
    void load()
  }, [load])

  const handleSearch = () => {
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  const handleReset = () => {
    setKeywordInput('')
    setKeyword('')
    setStatus('all')
    setRating('all')
    setCreatedFrom('')
    setCreatedTo('')
    setPage(1)
  }

  return (
    <div className="space-y-4 pb-8">
      <AdminPageHeader
        title="리뷰관리"
        description="AUTOON 앱에 등록된 전체 매장 리뷰를 조회하고 관리합니다."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard label="전체 리뷰" value={summary?.total ?? '-'} color="blue" />
        <AdminStatCard label="공개 리뷰" value={summary?.published ?? '-'} color="green" />
        <AdminStatCard label="숨김 리뷰" value={summary?.hidden ?? '-'} color="orange" />
        <AdminStatCard
          label="평균 평점"
          value={summary?.averageRating != null ? summary.averageRating.toFixed(1) : '-'}
          color="purple"
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="내용 · 작성자 · 업체 검색"
            className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <select
            value={rating}
            onChange={(e) => {
              setPage(1)
              setRating(e.target.value)
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">전체 평점</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r}점
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">전체 상태</option>
            <option value="PUBLISHED">공개</option>
            <option value="HIDDEN">숨김</option>
            <option value="DELETED">삭제</option>
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
        <p className="text-[11px] text-gray-400">
          신고 필터는 신고 원천 테이블이 없어 이번 1차에서 제공하지 않습니다.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <AdminTable
          loading={loading}
          emptyMessage="리뷰가 없습니다."
          columns={[
            { key: 'review', label: '리뷰' },
            { key: 'author', label: '작성자', width: '140px' },
            { key: 'partner', label: '업체', width: '140px' },
            { key: 'images', label: '이미지', width: '70px' },
            { key: 'created', label: '작성일', width: '110px' },
            { key: 'status', label: '상태', width: '80px' },
            { key: 'actions', label: '관리', width: '70px' },
          ]}
          data={items.map((row) => ({
            review: (
              <div>
                <div className="text-amber-500 text-xs">{stars(row.rating)}</div>
                <div className="text-sm text-gray-800 mt-0.5 line-clamp-2">{excerpt(row.content)}</div>
              </div>
            ),
            author: (
              <div className="text-sm">
                <div>{row.author.name}</div>
                <div className="text-xs text-gray-400">{row.author.phone || row.author.email || '-'}</div>
              </div>
            ),
            partner: (
              <div className="text-sm">
                <div>{row.partner.name}</div>
                <div className="text-xs text-gray-400">{row.partner.slug || '-'}</div>
              </div>
            ),
            images: row.imageCount,
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
                onClick={() => router.push(`/admin/reviews/${row.id}`)}
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
