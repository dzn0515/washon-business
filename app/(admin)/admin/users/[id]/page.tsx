'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import AdminTable from '@/components/admin/AdminTable'
import {
  fetchAdminAppUser,
  updateAdminAppUserMemo,
  updateAdminAppUserStatus,
  type AdminAppUserDetail,
} from '@/lib/admin-api'

const PROVIDER_LABEL: Record<string, string> = {
  EMAIL: '이메일',
  KAKAO: '카카오',
  NAVER: '네이버',
  GOOGLE: '구글',
  APPLE: 'Apple',
  PHONE: '전화',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '정상',
  SUSPENDED: '정지',
  WITHDRAWN: '탈퇴',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error' | 'info'> = {
  ACTIVE: 'success',
  SUSPENDED: 'error',
  WITHDRAWN: 'neutral',
}

const COUPON_LABEL: Record<string, string> = {
  AVAILABLE: '사용 가능',
  USED: '사용 완료',
  EXPIRED: '만료',
  CANCELLED: '취소',
  ISSUED: '사용 가능',
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('ko-KR')
}

function consentLabel(v: boolean | null | undefined) {
  if (v === true) return '동의'
  if (v === false) return '미동의'
  return '미수집'
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <dt className="w-28 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 break-all">{value}</dd>
    </div>
  )
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [detail, setDetail] = useState<AdminAppUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [memo, setMemo] = useState('')
  const [savingMemo, setSavingMemo] = useState(false)
  const [memoMsg, setMemoMsg] = useState<string | null>(null)

  const [suspendOpen, setSuspendOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminAppUser(id)
      setDetail(data)
      setMemo(data.adminMemo ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : '회원 상세를 불러오지 못했습니다.')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const handleSaveMemo = async () => {
    if (!id) return
    setSavingMemo(true)
    setMemoMsg(null)
    try {
      const updated = await updateAdminAppUserMemo(id, memo)
      setDetail(updated)
      setMemo(updated.adminMemo ?? '')
      setMemoMsg('메모가 저장되었습니다.')
    } catch (e) {
      setMemoMsg(e instanceof Error ? e.message : '메모 저장에 실패했습니다.')
    } finally {
      setSavingMemo(false)
    }
  }

  const handleSuspend = async () => {
    if (!id || !suspendReason.trim()) return
    setStatusSaving(true)
    setError(null)
    try {
      const updated = await updateAdminAppUserStatus(id, {
        status: 'SUSPENDED',
        reason: suspendReason.trim(),
      })
      setDetail(updated)
      setSuspendOpen(false)
      setSuspendReason('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '정지에 실패했습니다.')
    } finally {
      setStatusSaving(false)
    }
  }

  const handleRestore = async () => {
    if (!id) return
    setStatusSaving(true)
    setError(null)
    try {
      const updated = await updateAdminAppUserStatus(id, {
        status: 'ACTIVE',
        reason: '정지 해제',
      })
      setDetail(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : '정지 해제에 실패했습니다.')
    } finally {
      setStatusSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400 p-6">불러오는 중...</p>
  }
  if (!detail) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-red-600">{error ?? '회원을 찾을 수 없습니다.'}</p>
        <button
          type="button"
          onClick={() => router.push('/admin/users')}
          className="text-sm text-blue-600 underline"
        >
          목록으로
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={detail.name}
        description={`회원 ID ${detail.id}`}
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <AdminBadge
              label={STATUS_LABEL[detail.status] ?? detail.status}
              variant={STATUS_VARIANT[detail.status] ?? 'neutral'}
            />
            <Link
              href="/admin/users"
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              목록
            </Link>
            {detail.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => {
                  setSuspendReason('')
                  setSuspendOpen(true)
                }}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white"
              >
                회원 정지
              </button>
            ) : null}
            {detail.status === 'SUSPENDED' ? (
              <button
                type="button"
                disabled={statusSaving}
                onClick={() => void handleRestore()}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-40"
              >
                정지 해제
              </button>
            ) : null}
          </div>
        }
      />

      {error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard label="총 예약" value={detail.stats.reservationCount} color="blue" />
        <AdminStatCard
          label="취소 예약"
          value={detail.stats.cancelledReservationCount}
          color="orange"
        />
        <AdminStatCard label="이용 업체" value={detail.stats.visitedPartnerCount} color="purple" />
        <AdminStatCard
          label="최근 예약"
          value={
            detail.stats.lastReservationAt
              ? formatDateTime(detail.stats.lastReservationAt)
              : '이용 전'
          }
          color="green"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">기본정보</h3>
          <dl>
            <InfoRow label="이름" value={detail.name} />
            <InfoRow label="전화번호" value={detail.phone || '-'} />
            <InfoRow label="이메일" value={detail.email || '-'} />
            <InfoRow
              label="가입 방식"
              value={PROVIDER_LABEL[detail.loginProvider] ?? detail.loginProvider}
            />
            <InfoRow label="가입일" value={formatDateTime(detail.joinedAt)} />
            <InfoRow
              label="마지막 로그인"
              value={detail.lastLoginAt ? formatDateTime(detail.lastLoginAt) : '미수집'}
            />
            <InfoRow label="회원 ID" value={detail.id} />
          </dl>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">수신 동의</h3>
          <dl>
            <InfoRow label="푸시 동의" value={consentLabel(detail.pushConsent)} />
            <InfoRow label="마케팅 동의" value={consentLabel(detail.marketingConsent)} />
            <InfoRow label="SMS 동의" value={consentLabel(detail.marketingSmsConsent)} />
            <InfoRow
              label="푸시 디바이스"
              value={detail.hasPushDevice ? '등록됨' : '없음'}
            />
          </dl>
          {detail.status === 'SUSPENDED' ? (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-800 space-y-1">
              <p>정지 일시: {formatDateTime(detail.suspendedAt)}</p>
              <p>정지 사유: {detail.suspendReason || '-'}</p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">이용 업체</h3>
        {detail.visitedPartners.length === 0 ? (
          <p className="text-sm text-gray-400">이용 이력이 없습니다.</p>
        ) : (
          <AdminTable
            columns={[
              { key: 'name', label: '업체명' },
              { key: 'count', label: '예약 수', width: '90px' },
              { key: 'last', label: '최근 이용일', width: '160px' },
              { key: 'link', label: '', width: '80px' },
            ]}
            data={detail.visitedPartners.map((p) => ({
              name: (
                <div>
                  <span className="font-medium">{p.name}</span>
                  {p.status ? (
                    <span className="ml-2 text-[11px] text-gray-400">{p.status}</span>
                  ) : null}
                </div>
              ),
              count: p.reservationCount,
              last: formatDateTime(p.lastVisitedAt),
              link: (
                <Link
                  href={`/admin/businesses/${p.partnerId}`}
                  className="text-xs text-blue-600 underline"
                >
                  업체
                </Link>
              ),
            }))}
          />
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">보유 쿠폰</h3>
        {detail.coupons.length === 0 ? (
          <p className="text-sm text-gray-400">보유 쿠폰이 없습니다.</p>
        ) : (
          <AdminTable
            columns={[
              { key: 'name', label: '쿠폰명' },
              { key: 'status', label: '상태', width: '100px' },
              { key: 'exp', label: '만료일', width: '160px' },
            ]}
            data={detail.coupons.map((c) => ({
              name: c.name,
              status: COUPON_LABEL[c.status] ?? c.status,
              exp: formatDateTime(c.expiresAt),
            }))}
          />
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">관리자 메모</h3>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          placeholder="관리자 메모"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={savingMemo}
            onClick={() => void handleSaveMemo()}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-40"
          >
            {savingMemo ? '저장 중…' : '메모 저장'}
          </button>
          {memoMsg ? <span className="text-xs text-gray-500">{memoMsg}</span> : null}
        </div>
      </section>

      <AdminModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        title="회원 정지"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm border rounded-lg"
              onClick={() => setSuspendOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={statusSaving || !suspendReason.trim()}
              onClick={() => void handleSuspend()}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white disabled:opacity-40"
            >
              정지 확인
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            정지된 회원은 신규 로그인·토큰 갱신이 차단됩니다. 이미 발급된 access token은
            JWT 만료까지 유효할 수 있습니다.
          </p>
          <label className="block">
            정지 사유 (필수)
            <textarea
              className="mt-1 w-full border rounded-lg px-3 py-1.5"
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </label>
        </div>
      </AdminModal>
    </div>
  )
}
