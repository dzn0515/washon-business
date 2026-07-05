'use client'

import { useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import { billingTypeLabel } from '@/lib/billing/catalog'
import {
  AD_APPLICATION_PRODUCT_TYPE_LABEL,
  AD_APPLICATION_STATUS_LABEL,
  mockAdminAdApplications,
  type AdminAdApplication,
  type AdApplicationStatus,
} from '@/lib/mock/admin-ad-applications'

const STATUS_TABS: { key: 'all' | AdApplicationStatus; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '신청대기' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '반려' },
  { key: 'active', label: '진행중' },
  { key: 'ended', label: '종료' },
]

const STATUS_VARIANT: Record<
  AdApplicationStatus,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'error',
  active: 'success',
  ended: 'neutral',
}

function won(amount: number) {
  return amount.toLocaleString() + '원'
}

function formatDate(d: string | null) {
  return d ? d.replace(/-/g, '.') : '-'
}

export default function AdminAdApplicationsPage() {
  const { showToast, ToastComponent } = useToast()
  const [applications, setApplications] = useState<AdminAdApplication[]>(mockAdminAdApplications)
  const [statusTab, setStatusTab] = useState<'all' | AdApplicationStatus>('all')
  const [detail, setDetail] = useState<AdminAdApplication | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [adminMemo, setAdminMemo] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [mode, setMode] = useState<'view' | 'reject'>('view')

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

  const updateApplication = (id: string, patch: Partial<AdminAdApplication>) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    setDetail((prev) => (prev?.id === id ? { ...prev, ...patch } : prev))
  }

  const handleApprove = () => {
    if (!detail || !startDate || !endDate) {
      showToast('시작일과 종료일을 입력해 주세요.', 'warning')
      return
    }
    if (startDate > endDate) {
      showToast('종료일은 시작일 이후여야 합니다.', 'warning')
      return
    }
    updateApplication(detail.id, {
      status: 'active',
      startDate,
      endDate,
      adminMemo,
    })
    showToast('승인 처리되었습니다. (Mock)', 'success')
    closeDetail()
  }

  const handleReject = () => {
    if (!detail || !rejectReason.trim()) {
      showToast('반려 사유를 입력해 주세요.', 'warning')
      return
    }
    updateApplication(detail.id, {
      status: 'rejected',
      rejectReason: rejectReason.trim(),
      adminMemo,
      startDate: null,
      endDate: null,
    })
    showToast('반려 처리되었습니다. (Mock)', 'success')
    closeDetail()
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
    appliedAt: formatDate(app.appliedAt),
    status: (
      <AdminBadge
        label={AD_APPLICATION_STATUS_LABEL[app.status]}
        variant={STATUS_VARIANT[app.status]}
      />
    ),
    startDate: formatDate(app.startDate),
    endDate: formatDate(app.endDate),
  }))

  const pendingCount = applications.filter((a) => a.status === 'pending').length

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="광고 신청 관리"
        description="앱 노출·광고·자동화 상품 신청 확인 및 승인/반려"
      />

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 space-y-1">
        <p>실제 광고 노출 적용은 추후 API 연동 후 자동 처리됩니다.</p>
        <p className="text-blue-600">현재는 본사 운영 확인용 신청 관리 화면입니다.</p>
      </div>

      {pendingCount > 0 && (
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

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <AdminTable
          columns={[
            { key: 'businessName', label: '업체명' },
            { key: 'productName', label: '상품명' },
            { key: 'productType', label: '상품 유형' },
            { key: 'billingType', label: '결제 유형' },
            { key: 'amount', label: '금액' },
            { key: 'appliedAt', label: '신청일' },
            { key: 'status', label: '상태' },
            { key: 'startDate', label: '시작일' },
            { key: 'endDate', label: '종료일' },
          ]}
          data={tableData}
          emptyMessage="해당 상태의 신청이 없습니다."
          onRowClick={(row) => {
            const app = applications.find((a) => a.id === row.id)
            if (app) openDetail(app)
          }}
        />
      </div>

      <AdminModal
        open={!!detail}
        onClose={closeDetail}
        title="신청 상세"
        size="lg"
        footer={
          detail?.status === 'pending' ? (
            mode === 'reject' ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                >
                  반려 확정
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setMode('reject')}
                  className="flex-1 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
                >
                  반려
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  승인
                </button>
              </div>
            )
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
              <p className="text-xs font-medium text-gray-400 mb-2">신청 상품</p>
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
              <p className="text-gray-700 bg-gray-50 rounded-xl p-3">{detail.applicationMemo}</p>
            </section>

            <section>
              <p className="text-xs font-medium text-gray-400 mb-1">관리자 메모</p>
              <textarea
                value={adminMemo}
                onChange={(e) => setAdminMemo(e.target.value)}
                rows={2}
                placeholder="내부 메모"
                disabled={detail.status !== 'pending'}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none disabled:bg-gray-50"
              />
            </section>

            {detail.status === 'pending' && mode === 'view' && (
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-400">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </section>
            )}

            {detail.status === 'pending' && mode === 'reject' && (
              <section>
                <p className="text-xs font-medium text-gray-400 mb-1">반려 사유</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="사장님에게 전달될 반려 사유"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 resize-none"
                />
              </section>
            )}

            {detail.status !== 'pending' && (
              <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">상태</p>
                  <AdminBadge
                    label={AD_APPLICATION_STATUS_LABEL[detail.status]}
                    variant={STATUS_VARIANT[detail.status]}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400">시작일</p>
                  <p>{formatDate(detail.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">종료일</p>
                  <p>{formatDate(detail.endDate)}</p>
                </div>
                {detail.rejectReason && (
                  <div className="col-span-full">
                    <p className="text-xs text-gray-400">반려 사유</p>
                    <p className="text-red-600 mt-1">{detail.rejectReason}</p>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  )
}
