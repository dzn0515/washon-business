'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { CARD, BTN_PRIMARY } from '@/lib/dashboard-ui'
import { DemoModeError } from '@/lib/demo-mode'
import { AuthRequiredError } from '@/lib/api-client'
import {
  createBusinessReviewReply,
  deleteBusinessReviewReply,
  fetchBusinessReview,
  fetchBusinessReviews,
  updateBusinessReviewReply,
  type BusinessReviewDetail,
  type BusinessReviewListItem,
  type BusinessReviewStats,
} from '@/lib/business-reviews-api'

const PAGE_SIZE = 20

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: '공개',
  HIDDEN: '숨김',
  DELETED: '삭제',
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('ko-KR')
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('ko-KR')
}

function stars(rating: number) {
  return `${'★'.repeat(rating)}${'☆'.repeat(Math.max(0, 5 - rating))}`
}

export default function BusinessReviewsPage() {
  const [items, setItems] = useState<BusinessReviewListItem[]>([])
  const [stats, setStats] = useState<BusinessReviewStats | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [rating, setRating] = useState('all')
  const [replied, setReplied] = useState('all')
  const [status, setStatus] = useState('all')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<BusinessReviewDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBusinessReviews({
        keyword: keyword || undefined,
        rating: rating === 'all' ? undefined : Number(rating),
        replied: replied === 'all' ? undefined : replied === 'yes',
        status: status === 'all' ? undefined : status,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(data.items)
      setStats(data.stats)
      setTotal(data.total)
    } catch (e) {
      if (e instanceof DemoModeError) {
        setError('데모 모드에서는 리뷰 API를 사용할 수 없습니다.')
      } else if (e instanceof AuthRequiredError) {
        setError('로그인이 필요합니다.')
      } else {
        setError(e instanceof Error ? e.message : '리뷰 목록을 불러오지 못했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }, [keyword, rating, replied, status, createdFrom, createdTo, page])

  useEffect(() => {
    void load()
  }, [load])

  async function openDetail(id: string) {
    setDetailOpen(true)
    setDetailLoading(true)
    setActionMsg(null)
    setReplyText('')
    try {
      const data = await fetchBusinessReview(id)
      setDetail(data)
      setReplyText(data.partnerReply || '')
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : '리뷰를 불러오지 못했습니다.')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  function closeDetail() {
    if (saving) return
    setDetailOpen(false)
    setDetail(null)
    setReplyText('')
    setActionMsg(null)
    setDeleteOpen(false)
  }

  async function handleSaveReply() {
    if (!detail || !replyText.trim()) return
    setSaving(true)
    setActionMsg(null)
    try {
      const updated = detail.partnerReply
        ? await updateBusinessReviewReply(detail.id, replyText.trim())
        : await createBusinessReviewReply(detail.id, replyText.trim())
      setDetail(updated)
      setReplyText(updated.partnerReply || '')
      setActionMsg(detail.partnerReply ? '답글을 수정했습니다.' : '답글을 등록했습니다.')
      void load()
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : '답글 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteReply() {
    if (!detail) return
    setSaving(true)
    setActionMsg(null)
    try {
      const updated = await deleteBusinessReviewReply(detail.id)
      setDetail(updated)
      setReplyText('')
      setDeleteOpen(false)
      setActionMsg('답글을 삭제했습니다.')
      void load()
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : '답글 삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function handleSearch() {
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  function handleReset() {
    setKeywordInput('')
    setKeyword('')
    setRating('all')
    setReplied('all')
    setStatus('all')
    setCreatedFrom('')
    setCreatedTo('')
    setPage(1)
  }

  const canEditReply = detail?.canReply && detail.status !== 'DELETED'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">리뷰관리</h2>
        <p className="text-sm text-gray-500 mt-0.5">고객 리뷰를 확인하고 답글을 작성합니다.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">전체 리뷰</p>
          <p className="text-lg font-semibold">{stats?.total ?? '-'}</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">평균 평점</p>
          <p className="text-lg font-semibold">
            {stats?.averageRating != null ? stats.averageRating.toFixed(1) : '-'}
          </p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">미답변 리뷰</p>
          <p className="text-lg font-semibold">{stats?.unreplied ?? '-'}</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">이번 달 리뷰</p>
          <p className="text-lg font-semibold">{stats?.thisMonth ?? '-'}</p>
        </div>
      </div>

      <div className={`${CARD} space-y-3`}>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="리뷰 내용 검색"
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>
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
            value={replied}
            onChange={(e) => {
              setPage(1)
              setReplied(e.target.value)
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">답글 전체</option>
            <option value="yes">답글 있음</option>
            <option value="no">답글 없음</option>
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
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            검색
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
          >
            초기화
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-400">불러오는 중…</p>
      ) : items.length === 0 ? (
        <div className={`${CARD} text-sm text-gray-400 text-center py-8`}>리뷰가 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {items.map((row) => (
            <div key={row.id} className={CARD}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-amber-500 text-xs">{stars(row.rating)}</span>
                    <span className="text-xs text-gray-400">{row.authorName}</span>
                    {row.status !== 'PUBLISHED' && (
                      <Badge className="bg-gray-100 text-gray-600 text-[10px]">
                        {STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                    )}
                    {row.hasReply ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px]">답글완료</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 text-[10px]">미답변</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 mt-1 line-clamp-2">
                    {row.contentPreview || row.content || '(내용 없음)'}
                  </p>
                  {row.imageUrls.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {row.imageUrls.slice(0, 4).map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="w-10 h-10 object-cover rounded border border-gray-100"
                        />
                      ))}
                      {row.imageUrls.length > 4 && (
                        <span className="text-xs text-gray-400 self-center">+{row.imageUrls.length - 4}</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatDate(row.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void openDetail(row.id)}
                  className="shrink-0 px-3 py-1.5 text-xs text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50"
                >
                  관리
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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

      <Modal open={detailOpen} onClose={closeDetail} title="리뷰 상세" size="xl">
        {detailLoading ? (
          <p className="text-sm text-gray-400">불러오는 중…</p>
        ) : !detail ? (
          <p className="text-sm text-red-600">{actionMsg || '리뷰를 찾을 수 없습니다.'}</p>
        ) : (
          <div className="space-y-4">
            {actionMsg && <p className="text-sm text-gray-600">{actionMsg}</p>}

            {detail.status === 'HIDDEN' && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                관리자에 의해 숨김 처리된 리뷰입니다.
              </div>
            )}

            {detail.status === 'DELETED' && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                고객이 삭제한 리뷰입니다. 답글을 작성할 수 없습니다.
              </div>
            )}

            <div>
              <div className="text-amber-500 text-sm mb-1">{stars(detail.rating)}</div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {detail.content || '(내용 없음)'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {detail.authorName} · {formatDateTime(detail.createdAt)}
              </p>
            </div>

            {detail.imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {detail.imageUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg border border-gray-100"
                  />
                ))}
              </div>
            )}

            {detail.reservation && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                <p className="text-xs text-gray-400 mb-1">이용 서비스</p>
                <p className="text-gray-800">
                  {detail.reservation.serviceName || '서비스 정보 없음'}
                  {detail.reservation.bookingDate ? ` · ${detail.reservation.bookingDate}` : ''}
                  {detail.reservation.vehicleModel ? ` · ${detail.reservation.vehicleModel}` : ''}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">업체 답글</label>
              {canEditReply ? (
                <>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="고객에게 보여질 답글을 입력하세요."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">{replyText.length}/1000</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      disabled={saving || replyText.trim().length < 2}
                      onClick={() => void handleSaveReply()}
                      className={BTN_PRIMARY + ' disabled:opacity-40'}
                    >
                      {saving ? '저장 중…' : detail.partnerReply ? '답글 수정' : '답글 등록'}
                    </button>
                    {detail.partnerReply && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setDeleteOpen(true)}
                        className="px-4 py-2 text-sm text-red-600 border border-red-100 rounded-xl hover:bg-red-50 disabled:opacity-40"
                      >
                        답글 삭제
                      </button>
                    )}
                  </div>
                </>
              ) : detail.partnerReply ? (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{detail.partnerReply}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(detail.repliedAt)}
                    {detail.replyUpdatedAt ? ` · 수정 ${formatDateTime(detail.replyUpdatedAt)}` : ''}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">답글을 작성할 수 없습니다.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => !saving && setDeleteOpen(false)}
        title="답글 삭제"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          답글을 삭제하면 고객에게 더 이상 표시되지 않습니다.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => setDeleteOpen(false)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
          >
            취소
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleDeleteReply()}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm disabled:opacity-40"
          >
            {saving ? '삭제 중…' : '삭제'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
