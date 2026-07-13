'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import {
  fetchAdminReview,
  updateAdminReviewStatus,
  type AdminReviewDetail,
} from '@/lib/admin-api'

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

export default function AdminReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [detail, setDetail] = useState<AdminReviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hideOpen, setHideOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminReview(id)
      setDetail(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '리뷰를 불러오지 못했습니다.')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleHide() {
    if (!detail || !reason.trim()) return
    setSaving(true)
    setActionMsg(null)
    try {
      const updated = await updateAdminReviewStatus(detail.id, {
        status: 'HIDDEN',
        reason: reason.trim(),
      })
      setDetail(updated)
      setHideOpen(false)
      setReason('')
      setActionMsg('리뷰를 숨김 처리했습니다.')
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : '숨김 처리에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRestore() {
    if (!detail) return
    setSaving(true)
    setActionMsg(null)
    try {
      const updated = await updateAdminReviewStatus(detail.id, { status: 'PUBLISHED' })
      setDetail(updated)
      setRestoreOpen(false)
      setActionMsg('리뷰를 다시 공개했습니다.')
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : '공개 복구에 실패했습니다.')
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
        <p className="text-sm text-red-600">{error || '리뷰를 찾을 수 없습니다.'}</p>
        <button type="button" onClick={() => router.push('/admin/reviews')} className="text-sm text-blue-600">
          목록으로
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      <AdminPageHeader
        title={`리뷰 #${detail.id}`}
        description={formatDateTime(detail.createdAt)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge
              label={STATUS_LABEL[detail.status] ?? detail.status}
              variant={STATUS_VARIANT[detail.status] ?? 'neutral'}
            />
            <button
              type="button"
              onClick={() => router.push('/admin/reviews')}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              뒤로
            </button>
            {detail.status === 'PUBLISHED' && (
              <button
                type="button"
                onClick={() => setHideOpen(true)}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm"
              >
                리뷰 숨김
              </button>
            )}
            {detail.status === 'HIDDEN' && (
              <button
                type="button"
                onClick={() => setRestoreOpen(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              >
                공개 복구
              </button>
            )}
          </div>
        }
      />

      {actionMsg && <p className="text-sm text-gray-600">{actionMsg}</p>}

      <Section title="리뷰 내용">
        <div className="text-amber-500 text-sm mb-2">{stars(detail.rating)}</div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{detail.content || '(내용 없음)'}</p>
        <dl className="mt-3">
          <InfoRow label="작성일" value={formatDateTime(detail.createdAt)} />
          <InfoRow label="수정일" value={formatDateTime(detail.updatedAt)} />
        </dl>
        {detail.images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="w-24 h-24 object-cover rounded-lg border border-gray-100" />
            ))}
          </div>
        )}
      </Section>

      <Section title="작성자">
        <dl>
          <InfoRow label="이름" value={detail.author.name} />
          <InfoRow label="전화번호" value={detail.author.phone || '-'} />
          <InfoRow label="이메일" value={detail.author.email || '-'} />
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
          <InfoRow label="업종" value={detail.partner.bizType || '-'} />
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

      <Section title="예약 정보">
        {detail.reservation ? (
          <dl>
            <InfoRow label="예약 ID" value={detail.reservation.id} />
            <InfoRow label="예약번호" value={detail.reservation.bookingNumber || '-'} />
            <InfoRow label="예약일" value={detail.reservation.bookingDate || '-'} />
            <InfoRow label="상태" value={detail.reservation.status || '-'} />
            <InfoRow label="서비스" value={detail.reservation.serviceName || '-'} />
            <InfoRow
              label="차량"
              value={
                [detail.reservation.vehicleModel, detail.reservation.vehicleNumber]
                  .filter(Boolean)
                  .join(' · ') || '-'
              }
            />
            <InfoRow
              label="실이용 인증"
              value={detail.reservation.verifiedVisit ? '예 (완료/결제/리뷰완료)' : '아니오'}
            />
          </dl>
        ) : (
          <p className="text-sm text-gray-400">연결된 예약이 없습니다.</p>
        )}
      </Section>

      <Section title="업체 답글">
        {detail.reply.content ? (
          <dl>
            <InfoRow label="답글" value={detail.reply.content} />
            <InfoRow label="작성일" value={formatDateTime(detail.reply.repliedAt)} />
          </dl>
        ) : (
          <p className="text-sm text-gray-400">답글 없음</p>
        )}
      </Section>

      <Section title="신고 정보">
        <p className="text-sm text-gray-500">
          신고 원천 테이블이 없어 신고 수·사유는 이번 1차에서 제공하지 않습니다. (reportCount=0)
        </p>
      </Section>

      <Section title="관리자 처리">
        {detail.status === 'DELETED' ? (
          <p className="text-sm text-gray-500">작성자가 삭제한 리뷰는 관리자가 복구할 수 없습니다.</p>
        ) : detail.status === 'HIDDEN' ? (
          <dl>
            <InfoRow label="숨김 사유" value={detail.moderation.hiddenReason || '-'} />
            <InfoRow label="처리 관리자" value={detail.moderation.hiddenByAdminId || '-'} />
            <InfoRow label="처리 일시" value={formatDateTime(detail.moderation.hiddenAt)} />
          </dl>
        ) : (
          <p className="text-sm text-gray-500">현재 공개 상태입니다. 필요 시 상단에서 숨김 처리할 수 있습니다.</p>
        )}
      </Section>

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
              disabled={saving || !reason.trim()}
              onClick={() => void handleHide()}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm disabled:opacity-40"
            >
              {saving ? '처리 중…' : '숨김'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-3">숨김 사유를 입력하세요. 고객앱·공개 API에서 제외됩니다.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="예: 욕설 및 개인정보 포함"
        />
      </AdminModal>

      <AdminModal
        open={restoreOpen}
        onClose={() => !saving && setRestoreOpen(false)}
        title="공개 복구"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setRestoreOpen(false)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleRestore()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
            >
              {saving ? '처리 중…' : '공개 복구'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">이 리뷰를 다시 고객에게 공개할까요?</p>
      </AdminModal>
    </div>
  )
}
