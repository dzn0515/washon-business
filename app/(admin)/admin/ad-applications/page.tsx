'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import { usePermission } from '@/hooks/useAdminPermissions'
import {
  approveAdApp,
  endAdApp,
  fetchAdAppApplications,
  formatAdminPermissionError,
  rejectAdApp,
} from '@/lib/admin-api'
import {
  AD_APPLICATION_PRODUCT_TYPE_LABEL,
  AD_APPLICATION_STATUS_LABEL,
  type AdApplicationStatus,
  type AdminAdApplication,
} from '@/lib/ad-applications/types'
import {
  formatDisplayDate,
  historyStatusLabel,
  remainingPeriodLabel,
} from '@/lib/ad-applications/utils'
import { billingTypeLabel } from '@/lib/billing/catalog'

const STATUS_TABS: { key: 'all' | AdApplicationStatus; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'PENDING_REVIEW', label: '신청대기' },
  { key: 'APPROVED', label: '승인' },
  { key: 'REJECTED', label: '반려' },
  { key: 'ACTIVE', label: '진행중' },
  { key: 'ENDED', label: '종료' },
]

const STATUS_VARIANT: Record<
  AdApplicationStatus,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  PENDING_REVIEW: 'warning',
  APPROVED: 'info',
  REJECTED: 'error',
  ACTIVE: 'success',
  ENDED: 'neutral',
}

function won(amount: number) {
  return amount.toLocaleString() + '원'
}

function formatHistoryTime(iso: string) {
  return iso.slice(0, 16).replace('T', ' ')
}

export default function AdminAdApplicationsPage() {
  const { showToast, ToastComponent } = useToast()
  const [applications, setApplications] = useState<AdminAdApplication[]>([])
  const [statusTab, setStatusTab] = useState<'all' | AdApplicationStatus>('all')
  const [detail, setDetail] = useState<AdminAdApplication | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [adminMemo, setAdminMemo] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [mode, setMode] = useState<'view' | 'reject'>('view')
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdAppApplications()
      setApplications(data)
    } catch {
      setError(true)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () =>
      statusTab === 'all'
        ? applications
        : applications.filter((a) => a.status === statusTab),
    [applications, statusTab],
  )

  const openDetail = (app: AdminAdApplication) => {
    setDetail(app)
    setStartDate(app.startDate ?? '')
    setEndDate(app.endDate ?? '')
    setAdminMemo(app.adminMemo)
    setRejectReason(app.rejectReason ?? '')
    setMode('view')
  }

  const closeDetail = () => {
    setDetail(null)
    setMode('view')
    setRejectReason('')
  }

  const onApprove = async () => {
    if (!detail) return
    if (!startDate || !endDate || startDate > endDate) {
      showToast('시작일·종료일을 확인해 주세요.', 'warning')
      return
    }
    setProcessing(true)
    try {
      const updated = await approveAdApp(detail.id, { startDate, endDate, adminMemo })
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      showToast(`승인 처리 (${AD_APPLICATION_STATUS_LABEL[updated.status]})`, 'success')
      closeDetail()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '승인 처리에 실패했습니다.'), 'error')
    } finally {
      setProcessing(false)
    }
  }

  const onReject = async () => {
    if (!detail) return
    if (!rejectReason.trim()) {
      showToast('반려 사유를 입력해 주세요.', 'warning')
      return
    }
    setProcessing(true)
    try {
      const updated = await rejectAdApp(detail.id, { rejectReason, adminMemo })
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      showToast('반려 처리되었습니다.', 'success')
      closeDetail()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '반려 처리에 실패했습니다.'), 'error')
    } finally {
      setProcessing(false)
    }
  }

  const onEnd = async () => {
    if (!detail) return
    setProcessing(true)
    try {
      const updated = await endAdApp(detail.id, { adminMemo })
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      showToast('종료 처리되었습니다.', 'success')
      closeDetail()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '종료 처리에 실패했습니다.'), 'error')
    } finally {
      setProcessing(false)
    }
  }

  const tableData = filtered.map((app) => ({
    id: app.id,
    businessName: <span className="font-medium text-gray-900">{app.businessName}</span>,
    productName: app.productName,
    productType: (
      <span className="text-xs text-gray-600">
        {AD_APPLICATION_PRODUCT_TYPE_LABEL[app.productType]}
      </span>
    ),
    billingType: billingTypeLabel(app.billingType),
    amount: <span className="font-medium">{won(app.amount)}</span>,
    status: (
      <AdminBadge
        label={AD_APPLICATION_STATUS_LABEL[app.status]}
        variant={STATUS_VARIANT[app.status]}
      />
    ),
    appliedAt: formatDisplayDate(app.appliedAt),
    startDate: formatDisplayDate(app.startDate),
    endDate: formatDisplayDate(app.endDate),
    remaining: (
      <span className="text-xs text-gray-600">
        {remainingPeriodLabel(app.status, app.startDate, app.endDate)}
      </span>
    ),
  }))

  const pendingCount = applications.filter((a) => a.status === 'PENDING_REVIEW').length
  const canEnd = detail?.status === 'ACTIVE' || detail?.status === 'APPROVED'
  const { canApprove } = usePermission('ad_applications')

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="광고 신청 관리"
        description="앱 노출·광고·자동화 상품 신청 확인 및 승인/반려/종료"
      />

      {error && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">광고 신청 목록을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      )}

      {!error && pendingCount > 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          신청 대기 {pendingCount}건 — 확인 후 승인 또는 반려 처리해 주세요.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? applications.length
              : applications.filter((a) => a.status === tab.key).length
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusTab(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                statusTab === tab.key
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label} {count}
            </button>
          )
        })}
      </div>

      {!error && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          {loading ? (
            <p className="text-sm text-gray-400 py-10 text-center">불러오는 중...</p>
          ) : (
            <AdminTable
              columns={[
                { key: 'businessName', label: '업체명' },
                { key: 'productName', label: '상품명' },
                { key: 'productType', label: '상품 유형' },
                { key: 'billingType', label: '결제 유형' },
                { key: 'amount', label: '금액' },
                { key: 'status', label: '상태' },
                { key: 'appliedAt', label: '신청일' },
                { key: 'startDate', label: '시작일' },
                { key: 'endDate', label: '종료일' },
                { key: 'remaining', label: '남은 기간' },
              ]}
              data={tableData}
              emptyMessage="해당 상태의 신청이 없습니다."
              onRowClick={(row) => {
                const app = applications.find((a) => a.id === row.id)
                if (app) openDetail(app)
              }}
            />
          )}
        </div>
      )}

      <AdminModal
        open={!!detail}
        onClose={closeDetail}
        title="신청 상세"
        size="lg"
        footer={
          !canApprove ? undefined : detail?.status === 'PENDING_REVIEW' ? (
            mode === 'reject' ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setMode('view')}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={onReject}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  반려 확정
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setMode('reject')}
                  className="flex-1 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
                >
                  반려
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={onApprove}
                  className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  승인
                </button>
              </div>
            )
          ) : canEnd ? (
            <button
              type="button"
              disabled={processing}
              onClick={onEnd}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              종료 처리
            </button>
          ) : undefined
        }
      >
        {detail && (
          <div className="space-y-5 text-sm">
            <section>
              <p className="text-xs font-medium text-gray-400 mb-2">업체 정보</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="font-semibold text-gray-900">{detail.businessName}</p>
                <p className="text-gray-600">
                  {detail.ownerName} · {detail.ownerPhone}
                </p>
                <p className="text-gray-500">{detail.ownerEmail}</p>
              </div>
            </section>

            <section>
              <p className="text-xs font-medium text-gray-400 mb-2">상품 정보</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-400 text-xs">상품명</p>
                  <p className="font-medium text-gray-900">{detail.productName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">유형</p>
                  <p>{AD_APPLICATION_PRODUCT_TYPE_LABEL[detail.productType]}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">결제 유형</p>
                  <p>{billingTypeLabel(detail.billingType)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">금액 (VAT 별도)</p>
                  <p className="font-semibold text-blue-600">{won(detail.amount)}</p>
                </div>
              </div>
            </section>

            <section>
              <p className="text-xs font-medium text-gray-400 mb-1">신청 메모</p>
              <p className="text-gray-700 bg-gray-50 rounded-xl p-3">{detail.applicationMemo || '-'}</p>
            </section>

            <section>
              <p className="text-xs font-medium text-gray-400 mb-1">관리자 메모</p>
              <textarea
                value={adminMemo}
                onChange={(e) => setAdminMemo(e.target.value)}
                rows={2}
                placeholder="내부 메모"
                disabled={detail.status !== 'PENDING_REVIEW' && !canEnd}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none disabled:bg-gray-50"
              />
            </section>

            {detail.status === 'PENDING_REVIEW' && mode === 'view' && (
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-400">시작일 *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400">종료일 *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <p className="col-span-full text-xs text-gray-400">
                  시작일이 오늘 이하이면 진행중(ACTIVE), 미래이면 승인(APPROVED)으로 처리됩니다.
                </p>
              </section>
            )}

            {detail.status === 'PENDING_REVIEW' && mode === 'reject' && (
              <section>
                <p className="text-xs font-medium text-gray-400 mb-1">반려 사유 *</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="사장님에게 전달될 반려 사유"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 resize-none"
                />
              </section>
            )}

            {detail.status !== 'PENDING_REVIEW' && (
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">상태</p>
                  <AdminBadge
                    label={AD_APPLICATION_STATUS_LABEL[detail.status]}
                    variant={STATUS_VARIANT[detail.status]}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400">시작일</p>
                  <p>{formatDisplayDate(detail.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">종료일</p>
                  <p>{formatDisplayDate(detail.endDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">남은 기간</p>
                  <p>{remainingPeriodLabel(detail.status, detail.startDate, detail.endDate)}</p>
                </div>
                {detail.rejectReason && (
                  <div className="col-span-full">
                    <p className="text-xs text-gray-400">반려 사유</p>
                    <p className="text-red-600 mt-1">{detail.rejectReason}</p>
                  </div>
                )}
              </section>
            )}

            <section>
              <p className="text-xs font-medium text-gray-400 mb-2">상태 변경 이력</p>
              {detail.statusHistory.length === 0 ? (
                <p className="text-xs text-gray-400">이력이 없습니다.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {detail.statusHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <div>
                        <span className="font-medium text-gray-800">
                          {historyStatusLabel(entry.status)}
                        </span>
                        <span className="text-gray-500 ml-2 text-xs">{entry.note}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {formatHistoryTime(entry.changedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </AdminModal>
    </div>
  )
}
