'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import {
  fetchAdminReviewReport,
  resolveAdminReviewReport,
  type AdminReviewReportDetail,
} from '@/lib/admin-api'

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

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('ko-KR')
}

function stars(rating: number) {
  return `${'★'.repeat(rating)}${'☆'.repeat(Math.max(0, 5 - rating))}`
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <dt className="w-28 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 break-all">{value}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-gray-100 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-2">{title}</h2>
      {children}
    </section>
  )
}

export default function AdminReviewReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [detail, setDetail] = useState<AdminReviewReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissOpen, setDismissOpen] = useState(false)
  const [hideOpen, setHideOpen] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminReviewReport(id)
      setDetail(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '신고를 불러오지 못했습니다.')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleResolve(resolution: 'DISMISSED' | 'HIDE_REVIEW') {
    if (!detail || !note.trim()) return
    setSaving(true)
    setActionMsg(null)
    try {
      const updated = await resolveAdminReviewReport(detail.id, {
        resolution,
        note: note.trim(),
      })
      setDetail(updated)
      setDismissOpen(false)
      setHideOpen(false)
      setNote('')
      setActionMsg(
        resolution === 'DISMISSED' ? '신고를 기각 처리했습니다.' : '리뷰를 숨김 처리했습니다.',
      )
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : '처리에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400 p-4">불러오는 중…</p>
  }

  if (error || !detail) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-red-600">{error || '신고를 찾을 수 없습니다.'}</p>
        <button
          type="button"
          onClick={() => router.push('/admin/review-reports')}
          className="text-sm text-blue-600"
        >
          목록으로
        </button>
      </div>
    )
  }

  const isPending = detail.status === 'PENDING'
  const reviewStatus = detail.review.status

  return (
    <div className="space-y-4 pb-8">
      <AdminPageHeader
        title={`리뷰 신고 #${detail.id}`}
        description={formatDateTime(detail.createdAt)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge
              label={STATUS_LABEL[detail.status] ?? detail.status}
              variant={STATUS_VARIANT[detail.status] ?? 'neutral'}
            />
            <button
              type="button"
              onClick={() => router.push('/admin/review-reports')}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              뒤로
            </button>
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => setDismissOpen(true)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                >
                  기각
                </button>
                <button
                  type="button"
                  onClick={() => setHideOpen(true)}
                  disabled={reviewStatus === 'DELETED'}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm disabled:opacity-40"
                >
                  리뷰 숨김
                </button>
              </>
            )}
          </div>
        }
      />

      {actionMsg && <p className="text-sm text-gray-600">{actionMsg}</p>}

      <Section title="신고 정보">
        <dl>
          <InfoRow label="사유" value={REASON_LABEL[detail.reason] ?? detail.reason} />
          <InfoRow label="상세" value={detail.detail || '-'} />
          <InfoRow label="신고일" value={formatDateTime(detail.createdAt)} />
          <InfoRow label="누적 신고" value={`${detail.reportCount}건 (대기 ${detail.pendingCount}건)`} />
          {detail.processedAt && (
            <>
              <InfoRow label="처리일" value={formatDateTime(detail.processedAt)} />
              <InfoRow label="처리 메모" value={detail.resolutionNote || '-'} />
              <InfoRow label="처리 관리자" value={detail.processedByAdminId || '-'} />
            </>
          )}
        </dl>
      </Section>

      <Section title="신고된 리뷰">
        <div className="text-amber-500 text-sm mb-2">{stars(detail.review.rating)}</div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">
          {detail.review.content || '(내용 없음)'}
        </p>
        <dl className="mt-3">
          <InfoRow label="리뷰 ID" value={detail.review.id} />
          <InfoRow label="상태" value={detail.review.status} />
          <InfoRow label="작성일" value={formatDateTime(detail.review.createdAt)} />
          {detail.review.hiddenReason && (
            <InfoRow label="숨김 사유" value={detail.review.hiddenReason} />
          )}
        </dl>
        {detail.review.images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.review.images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="w-24 h-24 object-cover rounded-lg border border-gray-100" />
            ))}
          </div>
        )}
        {detail.review.partnerReply && (
          <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400 mb-1">업체 답글</p>
            <p className="text-sm text-gray-800">{detail.review.partnerReply}</p>
          </div>
        )}
        <div className="mt-3">
          <Link href={`/admin/reviews/${detail.review.id}`} className="text-sm text-blue-600 hover:underline">
            리뷰 상세 보기
          </Link>
        </div>
      </Section>

      <Section title="신고자">
        <dl>
          <InfoRow label="이름" value={detail.reporter.name || '-'} />
          <InfoRow label="이메일" value={detail.reporter.email || '-'} />
          <InfoRow label="전화번호" value={detail.reporter.phone || '-'} />
          <InfoRow
            label="회원"
            value={
              detail.reporter.id ? (
                <Link href={`/admin/users/${detail.reporter.id}`} className="text-blue-600 hover:underline">
                  회원 상세
                </Link>
              ) : (
                '-'
              )
            }
          />
        </dl>
      </Section>

      <Section title="리뷰 작성자">
        <dl>
          <InfoRow label="이름" value={detail.author.name || '-'} />
          <InfoRow label="전화번호" value={detail.author.phone || '-'} />
          <InfoRow
            label="회원"
            value={
              detail.author.id ? (
                <Link href={`/admin/users/${detail.author.id}`} className="text-blue-600 hover:underline">
                  회원 상세
                </Link>
              ) : (
                '연결 계정 없음'
              )
            }
          />
        </dl>
      </Section>

      <Section title="업체">
        <dl>
          <InfoRow label="업체명" value={detail.partner.name} />
          <InfoRow label="slug" value={detail.partner.slug || '-'} />
          <InfoRow
            label="업체"
            value={
              <Link href={`/admin/businesses/${detail.partner.id}`} className="text-blue-600 hover:underline">
                업체 상세
              </Link>
            }
          />
        </dl>
      </Section>

      <AdminModal
        open={dismissOpen}
        onClose={() => !saving && setDismissOpen(false)}
        title="신고 기각"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setDismissOpen(false)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving || !note.trim()}
              onClick={() => void handleResolve('DISMISSED')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
            >
              {saving ? '처리 중…' : '기각'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-3">
          신고를 기각합니다. 리뷰는 그대로 공개 상태를 유지합니다.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="처리 메모 (필수)"
        />
      </AdminModal>

      <AdminModal
        open={hideOpen}
        onClose={() => !saving && setHideOpen(false)}
        title="리뷰 숨김"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setHideOpen(false)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving || !note.trim()}
              onClick={() => void handleResolve('HIDE_REVIEW')}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm disabled:opacity-40"
            >
              {saving ? '처리 중…' : '리뷰 숨김'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-amber-700 mb-3">
          리뷰를 숨기면 고객앱·공개 API에서 제외됩니다. 동일 리뷰의 다른 대기 신고도 함께 조치 완료 처리됩니다.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="숨김 사유 (필수)"
        />
      </AdminModal>
    </div>
  )
}
