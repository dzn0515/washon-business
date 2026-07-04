'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import {
  fetchAdminBusinessDetail,
  fetchAdminAllReservations,
  updateBusinessStatus,
  saveBusinessMemo,
  type AdminBusinessDetail,
} from '@/lib/admin-api'
import { BUSINESS_STATUS_LABEL, BUSINESS_STATUS_VARIANT } from '@/lib/admin-ui'
import { BUSINESS_TYPE_LABELS } from '@/lib/business-types'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE } from '@/constants'
import type { BookingStatus } from '@/types'
import Badge from '@/components/ui/Badge'

const TABS = ['기본정보', '예약내역', 'QR', '메모'] as const
type Tab = (typeof TABS)[number]

export default function AdminBusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [tab, setTab] = useState<Tab>('기본정보')
  const [business, setBusiness] = useState<AdminBusinessDetail | null>(null)
  const [reservations, setReservations] = useState<Record<string, unknown>[]>([])
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [resLoading, setResLoading] = useState(false)
  const [memoSaving, setMemoSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdminBusinessDetail(id)
      setBusiness(data)
      setMemo(data.memo)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (tab !== '예약내역') return
    setResLoading(true)
    fetchAdminAllReservations({ businessId: id, limit: 10 })
      .then((data) => setReservations(data))
      .catch(() => setReservations([]))
      .finally(() => setResLoading(false))
  }, [tab, id])

  const handleStatusChange = async () => {
    if (!business || !pendingStatus) return
    setStatusLoading(true)
    try {
      await updateBusinessStatus(business.id, pendingStatus)
      showToast('상태가 변경되었습니다.', 'success')
      setConfirmOpen(false)
      load()
    } catch {
      showToast('상태 변경에 실패했습니다.', 'error')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleMemoSave = async () => {
    setMemoSaving(true)
    try {
      await saveBusinessMemo(id, memo)
      showToast('메모가 저장되었습니다.', 'success')
    } catch {
      showToast('메모 저장에 실패했습니다.', 'error')
    } finally {
      setMemoSaving(false)
    }
  }

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      showToast('링크가 복사되었습니다.', 'success')
    } catch {
      showToast('복사에 실패했습니다.', 'error')
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-400 py-12 text-center">불러오는 중...</div>
  }

  if (error || !business) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-sm text-gray-500 mb-4">업체 정보를 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          다시 시도
        </button>
      </div>
    )
  }

  const reservationUrl = business.slug ? `https://autoon.kr/store/${business.slug}` : null

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title={business.name}
        description={`업체 ID: ${business.id}`}
        actions={
          <button
            type="button"
            onClick={() => router.push('/admin/businesses')}
            className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
          >
            ← 목록
          </button>
        }
      />

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === '기본정보' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <InfoRow label="업체명" value={business.name} />
            <InfoRow label="업종" value={BUSINESS_TYPE_LABELS[business.bizType] ?? business.bizType} />
            <InfoRow label="대표자" value={business.ownerName} />
            <InfoRow label="연락처" value={business.phone} />
            <InfoRow label="이메일" value={business.email || '-'} />
            <InfoRow label="주소" value={business.address || '-'} />
            <InfoRow label="가입일" value={business.createdAt} />
            <InfoRow
              label="현재 상태"
              value={
                <AdminBadge
                  label={BUSINESS_STATUS_LABEL[business.status] ?? business.status}
                  variant={BUSINESS_STATUS_VARIANT[business.status] ?? 'neutral'}
                />
              }
            />
            <InfoRow label="구독 플랜" value={business.plan ?? '-'} />
            <InfoRow label="최근 로그인" value={business.lastLogin ?? '-'} />
            <InfoRow label="최근 예약 수" value={`${business.recentReservations}건`} />
            <InfoRow
              label="최근 매출"
              value={`${business.recentRevenue.toLocaleString()}원`}
            />
            <InfoRow
              label="평점"
              value={business.rating != null ? business.rating.toFixed(1) : '-'}
            />
          </div>
          <div className="pt-4 border-t border-gray-100 flex gap-2">
            {business.status === 'pending' && (
              <StatusBtn
                label="승인"
                onClick={() => {
                  setPendingStatus('active')
                  setConfirmOpen(true)
                }}
              />
            )}
            {business.status === 'active' && (
              <StatusBtn
                label="정지"
                danger
                onClick={() => {
                  setPendingStatus('suspended')
                  setConfirmOpen(true)
                }}
              />
            )}
            {business.status === 'suspended' && (
              <StatusBtn
                label="복구"
                onClick={() => {
                  setPendingStatus('active')
                  setConfirmOpen(true)
                }}
              />
            )}
          </div>
        </div>
      )}

      {tab === '예약내역' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <AdminTable
            loading={resLoading}
            columns={[
              { key: 'customerName', label: '고객' },
              { key: 'menuName', label: '메뉴' },
              { key: 'bookingDate', label: '날짜' },
              { key: 'startTime', label: '시간' },
              { key: 'status', label: '상태' },
            ]}
            data={reservations.map((r) => {
              const status = String(r.status) as BookingStatus
              return {
                ...r,
                status: (
                  <Badge className={BOOKING_STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-600'}>
                    {BOOKING_STATUS_LABEL[status] ?? status}
                  </Badge>
                ),
              }
            })}
            emptyMessage="예약 내역이 없습니다."
          />
        </div>
      )}

      {tab === 'QR' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          {reservationUrl ? (
            <>
              <div className="flex justify-center mb-4">
                <QRCodeSVG value={reservationUrl} size={160} />
              </div>
              <p className="text-sm text-gray-600 mb-4 break-all">{reservationUrl}</p>
              <button
                type="button"
                onClick={() => copyLink(reservationUrl)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                링크 복사
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-500 py-8">
              QR 링크가 없습니다. Slug를 먼저 설정해주세요.
            </p>
          )}
        </div>
      )}

      {tab === '메모' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={6}
            placeholder="운영자 메모를 입력하세요"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleMemoSave}
              disabled={memoSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {memoSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      <AdminModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="상태 변경"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={statusLoading}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleStatusChange}
              disabled={statusLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {statusLoading ? '처리 중...' : '확인'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          {business.name} 업체 상태를{' '}
          <strong>{BUSINESS_STATUS_LABEL[pendingStatus] ?? pendingStatus}</strong>(으)로
          변경하시겠습니까?
        </p>
      </AdminModal>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <div className="text-gray-900 font-medium">{value}</div>
    </div>
  )
}

function StatusBtn({
  label,
  onClick,
  danger,
}: {
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium ${
        danger
          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {label}
    </button>
  )
}
