'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Check, X } from 'lucide-react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/admin/AdminToast'
import { usePermission } from '@/hooks/useAdminPermissions'
import {
  approveAdminPartner,
  fetchAdminPartners,
  formatAdminPermissionError,
  rejectAdminPartner,
  type AdminPartnerListItem,
} from '@/lib/admin-api'
import { getAdminBizTypeLabel, PARTNER_ADMISSION_STATUS_LABEL } from '@/lib/admin-ui'
import { getResourceLabel } from '@/lib/resource-label'

type Tab = 'pending' | 'active' | 'rejected'

const TAB_API_STATUS = {
  pending: 'PENDING',
  active: 'ACTIVE',
  rejected: 'REJECTED',
} as const

export default function AdminPendingBusinessesPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const { canApprove } = usePermission('business_reviews')
  const [tab, setTab] = useState<Tab>('pending')
  const [counts, setCounts] = useState({ pending: 0, active: 0, rejected: 0 })
  const [list, setList] = useState<AdminPartnerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [approveTarget, setApproveTarget] = useState<AdminPartnerListItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminPartnerListItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadCounts = useCallback(async () => {
    const [pending, active, rejected] = await Promise.all([
      fetchAdminPartners('PENDING'),
      fetchAdminPartners('ACTIVE'),
      fetchAdminPartners('REJECTED'),
    ])
    setCounts({
      pending: pending.length,
      active: active.length,
      rejected: rejected.length,
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    setErrorMessage(null)
    try {
      const data = await fetchAdminPartners(TAB_API_STATUS[tab])
      setList(data)
    } catch (e) {
      setError(true)
      setErrorMessage(formatAdminPermissionError(e, '목록을 불러오지 못했습니다.'))
      setList([])
    } finally {
      setLoading(false)
    }
  }, [tab])

  const refresh = useCallback(async () => {
    await Promise.all([load(), loadCounts()])
  }, [load, loadCounts])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadCounts().catch(() => {})
  }, [loadCounts])

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending', label: '승인대기', count: counts.pending },
    { key: 'active', label: '승인완료', count: counts.active },
    { key: 'rejected', label: '거절', count: counts.rejected },
  ]

  const handleApprove = async () => {
    if (!approveTarget) return
    setActionLoading(true)
    try {
      await approveAdminPartner(approveTarget.id)
      showToast('업체가 승인되었습니다.', 'success')
      setApproveTarget(null)
      await refresh()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '승인 처리에 실패했습니다.'), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      await rejectAdminPartner(rejectTarget.id, rejectReason.trim())
      showToast('업체 가입이 거절되었습니다.', 'success')
      setRejectTarget(null)
      setRejectReason('')
      await refresh()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '거절 처리에 실패했습니다.'), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {ToastComponent}
      <AdminPageHeader title="입점심사" description="신규 업체 가입 승인 및 거절 처리" />

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border ${
              tab === t.key
                ? 'bg-[#1A6DFF] text-white border-[#1A6DFF]'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {t.label} {t.count}
          </button>
        ))}
      </div>

      {tab === 'pending' && counts.pending > 0 && !error && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          승인 대기 {counts.pending}건 — 빠른 처리가 필요합니다
        </p>
      )}

      {error ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-2">업체 목록을 불러오지 못했습니다.</p>
          {errorMessage ? (
            <p className="text-sm text-red-600 mb-4 whitespace-pre-line">{errorMessage}</p>
          ) : (
            <div className="mb-4" />
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : loading ? (
        <p className="text-sm text-gray-400 text-center py-12">불러오는 중...</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          {tab === 'pending'
            ? '승인 대기 업체가 없습니다.'
            : tab === 'active'
              ? '승인 완료된 업체가 없습니다.'
              : '거절된 업체가 없습니다.'}
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              {tab === 'pending' ? (
                <PendingCard
                  business={b}
                  canApprove={canApprove}
                  onApprove={() => setApproveTarget(b)}
                  onReject={() => setRejectTarget(b)}
                />
              ) : (
                <ReviewedCard business={b} tab={tab} onDetail={() => router.push(`/admin/businesses/${b.id}`)} />
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!approveTarget} onClose={() => !actionLoading && setApproveTarget(null)} title="업체 승인" size="sm">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm font-medium text-gray-900">업체를 승인하시겠습니까?</p>
            {approveTarget && (
              <p className="text-sm text-gray-600 mt-1">
                {approveTarget.name} ({approveTarget.ownerName})
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">승인 시 업체 상태가 운영중(ACTIVE)으로 변경됩니다.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" disabled={actionLoading} onClick={() => setApproveTarget(null)}>
              취소
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={actionLoading} onClick={handleApprove}>
              {actionLoading ? '처리 중...' : '승인하기'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!rejectTarget} onClose={() => !actionLoading && setRejectTarget(null)} title="업체 거절" size="sm">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl mb-2">❌</div>
            <p className="text-sm font-medium text-gray-900">거절 사유를 입력해주세요</p>
          </div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="사유 입력"
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
          />
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" disabled={actionLoading} onClick={() => setRejectTarget(null)}>
              취소
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={!rejectReason.trim() || actionLoading}
              onClick={handleReject}
            >
              {actionLoading ? '처리 중...' : '거절하기'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function PendingCard({
  business: b,
  canApprove,
  onApprove,
  onReject,
}: {
  business: AdminPartnerListItem
  canApprove: boolean
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <>
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-semibold text-gray-900">{b.name}</h3>
        <span className="text-xs text-gray-400 shrink-0">{b.createdAt.replace(/-/g, '.')}</span>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {b.ownerName} · {b.email || '-'}
      </p>
      <p className="text-sm text-gray-500">
        {b.phone || '-'} · 사업자번호: {b.businessRegistrationNo || '-'}
      </p>
      <p className="text-sm text-gray-500 mt-1 flex items-start gap-1">
        <MapPin size={14} className="shrink-0 mt-0.5" />
        <span>
          {b.address || '-'}
          {b.address ? (
            <span className="block text-xs text-gray-400 mt-0.5">
              {b.hasCoordinates ? '좌표 등록됨' : '좌표 미등록'}
            </span>
          ) : null}
        </span>
      </p>
      <p className="text-xs text-gray-400 mt-2">
        업종: {getAdminBizTypeLabel(b.bizType)} · {getResourceLabel(b.bizType)}: {b.bayCount}개
      </p>
      {canApprove && (
        <div className="flex gap-2 mt-4">
          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={onApprove}>
            <Check size={14} className="mr-1" /> 승인
          </Button>
          <Button size="sm" variant="danger" className="flex-1" onClick={onReject}>
            <X size={14} className="mr-1" /> 거절
          </Button>
        </div>
      )}
    </>
  )
}

function ReviewedCard({
  business: b,
  tab,
  onDetail,
}: {
  business: AdminPartnerListItem
  tab: 'active' | 'rejected'
  onDetail: () => void
}) {
  const label = PARTNER_ADMISSION_STATUS_LABEL[b.status] ?? b.status
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-gray-900">{b.name}</h3>
        <Badge className={tab === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}>
          {label}
        </Badge>
        <span className="text-xs text-gray-400">{b.createdAt.replace(/-/g, '.')}</span>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        {b.ownerName} · {b.phone || '-'}
      </p>
      <div className="mt-3">
        <Button size="sm" variant="secondary" onClick={onDetail}>
          상세보기
        </Button>
      </div>
    </>
  )
}
