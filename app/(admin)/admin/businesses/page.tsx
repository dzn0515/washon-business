'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import {
  fetchAdminAllBusinesses,
  updateBusinessStatus,
  type AdminBusinessListItem,
} from '@/lib/admin-api'
import {
  ADMIN_BIZ_TYPE_FILTERS,
  BUSINESS_STATUS_LABEL,
  BUSINESS_STATUS_VARIANT,
  getAdminBizTypeLabel,
  type AdminBizTypeFilterKey,
} from '@/lib/admin-ui'

const STATUS_TABS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '승인대기' },
  { key: 'active', label: '운영중' },
  { key: 'suspended', label: '정지' },
  { key: 'rejected', label: '거절' },
] as const

type ConfirmAction = {
  business: AdminBusinessListItem
  title: string
  message: string
  nextStatus: string
  variant: 'danger' | 'primary'
  needsReason?: boolean
}

export default function AdminBusinessesPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [statusTab, setStatusTab] = useState('all')
  const [bizTypeTab, setBizTypeTab] = useState<AdminBizTypeFilterKey>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [businesses, setBusinesses] = useState<AdminBusinessListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdminAllBusinesses({ status: statusTab, search })
      setBusinesses(data)
    } catch {
      setError(true)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }, [statusTab, search])

  useEffect(() => {
    load()
  }, [load])

  const bizTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: businesses.length }
    for (const b of businesses) {
      counts[b.bizType] = (counts[b.bizType] ?? 0) + 1
    }
    return counts
  }, [businesses])

  const filteredBusinesses = useMemo(() => {
    if (bizTypeTab === 'all') return businesses
    return businesses.filter((b) => b.bizType === bizTypeTab)
  }, [businesses, bizTypeTab])

  const handleStatusAction = async () => {
    if (!confirm) return
    if (confirm.needsReason && !rejectReason.trim()) return
    setActionLoading(true)
    try {
      await updateBusinessStatus(
        confirm.business.id,
        confirm.nextStatus,
        confirm.needsReason ? rejectReason : undefined,
      )
      showToast('상태가 변경되었습니다.', 'success')
      setConfirm(null)
      setRejectReason('')
      load()
    } catch {
      showToast('상태 변경에 실패했습니다.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const openConfirm = (action: ConfirmAction) => {
    setRejectReason('')
    setConfirm(action)
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader title="업체 관리" description="가입 업체 승인 및 운영 상태 관리" />

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusTab === tab.key
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {ADMIN_BIZ_TYPE_FILTERS.map((tab) => {
          const count = bizTypeCounts[tab.key] ?? 0
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setBizTypeTab(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                bizTypeTab === tab.key
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label} {count}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
          placeholder="업체명, 대표자, 연락처 검색"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setSearch(searchInput)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          검색
        </button>
      </div>

      {error ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">업체 목록을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <AdminTable
            loading={loading}
            columns={[
              { key: 'name', label: '업체명' },
              { key: 'bizType', label: '업종' },
              { key: 'ownerName', label: '대표자' },
              { key: 'phone', label: '연락처' },
              { key: 'plan', label: '플랜' },
              { key: 'status', label: '상태' },
              { key: 'lastLogin', label: '최근 로그인' },
              { key: 'recentReservations', label: '최근 예약' },
              { key: 'rating', label: '평점' },
              { key: 'actions', label: '액션', width: '160px' },
            ]}
            data={filteredBusinesses.map((b) => ({
              ...b,
              bizType: getAdminBizTypeLabel(b.bizType),
              plan: b.plan ?? '-',
              lastLogin: b.lastLogin ?? '-',
              rating: b.rating != null ? b.rating.toFixed(1) : '-',
              status: (
                <AdminBadge
                  label={BUSINESS_STATUS_LABEL[b.status] ?? b.status}
                  variant={BUSINESS_STATUS_VARIANT[b.status] ?? 'neutral'}
                />
              ),
              actions: (
                <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                  <ActionBtn label="상세" onClick={() => router.push(`/admin/businesses/${b.id}`)} />
                  {b.status === 'pending' && (
                    <>
                      <ActionBtn
                        label="승인"
                        onClick={() =>
                          openConfirm({
                            business: b,
                            title: '업체 승인',
                            message: `${b.name} 업체를 승인하시겠습니까?`,
                            nextStatus: 'active',
                            variant: 'primary',
                          })
                        }
                      />
                      <ActionBtn
                        label="거절"
                        danger
                        onClick={() =>
                          openConfirm({
                            business: b,
                            title: '업체 거절',
                            message: `${b.name} 업체 가입을 거절하시겠습니까?`,
                            nextStatus: 'rejected',
                            variant: 'danger',
                            needsReason: true,
                          })
                        }
                      />
                    </>
                  )}
                  {b.status === 'active' && (
                    <ActionBtn
                      label="정지"
                      danger
                      onClick={() =>
                        openConfirm({
                          business: b,
                          title: '업체 정지',
                          message: `${b.name} 업체를 정지하시겠습니까?`,
                          nextStatus: 'suspended',
                          variant: 'danger',
                        })
                      }
                    />
                  )}
                  {b.status === 'suspended' && (
                    <ActionBtn
                      label="복구"
                      onClick={() =>
                        openConfirm({
                          business: b,
                          title: '업체 복구',
                          message: `${b.name} 업체를 복구하시겠습니까?`,
                          nextStatus: 'active',
                          variant: 'primary',
                        })
                      }
                    />
                  )}
                </div>
              ),
            }))}
            onRowClick={(row) => router.push(`/admin/businesses/${row.id}`)}
            emptyMessage="등록된 업체가 없습니다."
          />
        </div>
      )}

      <AdminModal
        open={!!confirm}
        onClose={() => {
          setConfirm(null)
          setRejectReason('')
        }}
        title={confirm?.title ?? ''}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirm(null)}
              disabled={actionLoading}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleStatusAction}
              disabled={actionLoading || (confirm?.needsReason && !rejectReason.trim())}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                confirm?.variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {actionLoading ? '처리 중...' : '확인'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">{confirm?.message}</p>
        {confirm?.needsReason && (
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="거절 사유를 입력하세요"
            rows={3}
            className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </AdminModal>
    </div>
  )
}

function ActionBtn({
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
      className={`px-2 py-1 rounded text-xs font-medium border ${
        danger
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}
