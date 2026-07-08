'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import Badge from '@/components/ui/Badge'
import {
  fetchAdminAllReservations,
  fetchAdminPartners,
  fetchAdminReservationDetail,
  forceCancelReservation,
  updateAdminReservationStatus,
  type AdminPartnerListItem,
  type AdminReservationDetail,
  type AdminReservationItem,
} from '@/lib/admin-api'
import {
  BOOKING_TIMELINE_STEPS,
  getTimelineStepIndex,
  RESERVATION_SOURCE_LABEL,
} from '@/lib/admin-ui'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE } from '@/constants'
import { BOOKING_STATUS_MAP, type BookingStatus } from '@/types'

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '예약접수' },
  { key: 'confirmed', label: '예약확정' },
  { key: 'arrived', label: '입차' },
  { key: 'in_progress', label: '작업중' },
  { key: 'completed', label: '완료' },
  { key: 'cancelled', label: '취소' },
  { key: 'noshow', label: '노쇼' },
]

const STATUS_ACTIONS: Record<string, { label: string; next: string; danger?: boolean }[]> = {
  pending: [
    { label: '예약확정', next: 'confirmed' },
    { label: '취소', next: 'cancelled', danger: true },
  ],
  waiting: [
    { label: '예약확정', next: 'confirmed' },
    { label: '취소', next: 'cancelled', danger: true },
  ],
  confirmed: [
    { label: '입차', next: 'arrived' },
    { label: '작업중', next: 'in_progress' },
    { label: '취소', next: 'cancelled', danger: true },
  ],
  arrived: [
    { label: '작업중', next: 'in_progress' },
    { label: '취소', next: 'cancelled', danger: true },
  ],
  in_progress: [
    { label: '완료', next: 'completed' },
    { label: '취소', next: 'cancelled', danger: true },
  ],
  completed: [
    { label: '결제완료', next: 'paid' },
    { label: '취소', next: 'cancelled', danger: true },
  ],
  paid: [{ label: '리뷰완료', next: 'reviewed' }],
}

function formatVehicle(v: AdminReservationItem['vehicle']): string {
  if (!v) return '-'
  const parts = [v.brand, v.model].filter(Boolean).join(' ')
  return parts ? `${parts} · ${v.licensePlate}` : v.licensePlate || '-'
}

function formatSource(source: string | null): string {
  if (!source) return '-'
  return RESERVATION_SOURCE_LABEL[source] ?? source
}

export default function AdminReservationsPage() {
  const { showToast, ToastComponent } = useToast()
  const [statusTab, setStatusTab] = useState('all')
  const [partnerId, setPartnerId] = useState('all')
  const [partners, setPartners] = useState<AdminPartnerListItem[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [reservations, setReservations] = useState<AdminReservationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [detail, setDetail] = useState<AdminReservationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<AdminReservationItem | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    fetchAdminPartners()
      .then(setPartners)
      .catch(() => setPartners([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdminAllReservations({
        status: statusTab,
        partnerId: partnerId !== 'all' ? partnerId : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search,
        page,
        pageSize,
      })
      setReservations(data.items)
      setTotal(data.total)
    } catch {
      setError(true)
      setReservations([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [statusTab, partnerId, dateFrom, dateTo, search, page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  const openDetail = async (item: AdminReservationItem) => {
    setDetail(item)
    setDetailLoading(true)
    try {
      const full = await fetchAdminReservationDetail(item.id)
      setDetail(full)
    } catch {
      showToast('예약 상세를 불러오지 못했습니다.', 'error')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleStatusChange = async (nextStatus: string, reason?: string) => {
    if (!detail) return
    setStatusLoading(true)
    try {
      await updateAdminReservationStatus(detail.id, nextStatus, reason)
      showToast('예약 상태가 변경되었습니다.', 'success')
      const full = await fetchAdminReservationDetail(detail.id)
      setDetail(full)
      load()
    } catch {
      showToast('상태 변경에 실패했습니다.', 'error')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return
    setCancelLoading(true)
    try {
      await forceCancelReservation(cancelTarget.id, cancelReason)
      showToast('예약이 취소되었습니다.', 'success')
      setCancelTarget(null)
      setCancelReason('')
      if (detail?.id === cancelTarget.id) setDetail(null)
      load()
    } catch {
      showToast('취소 처리에 실패했습니다.', 'error')
    } finally {
      setCancelLoading(false)
    }
  }

  const currentStepIdx = detail ? getTimelineStepIndex(detail.status) : -1
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const detailActions = detail ? STATUS_ACTIONS[detail.status] ?? [] : []

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader title="예약 관리" description="플랫폼 전체 예약 조회 및 관리" />

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setStatusTab(tab.key)
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              statusTab === tab.key
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-end bg-white border border-gray-200 rounded-xl p-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">업체</label>
          <select
            value={partnerId}
            onChange={(e) => {
              setPartnerId(e.target.value)
              setPage(1)
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm min-w-[180px]"
          >
            <option value="all">전체 업체</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">시작일</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">종료일</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-400 mb-1">검색</label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearch(searchInput)
                setPage(1)
              }
            }}
            placeholder="업체명, 고객명, 연락처"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setSearch(searchInput)
            setPage(1)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          검색
        </button>
      </div>

      {error ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">예약 목록을 불러오지 못했습니다.</p>
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
              { key: 'id', label: '예약번호' },
              { key: 'businessName', label: '업체명' },
              { key: 'customerName', label: '고객명' },
              { key: 'menuName', label: '메뉴' },
              { key: 'vehicle', label: '차량' },
              { key: 'source', label: '출처' },
              { key: 'datetime', label: '날짜/시간' },
              { key: 'status', label: '상태' },
              { key: 'actions', label: '액션', width: '140px' },
            ]}
            data={reservations.map((r) => {
              const status = r.status as BookingStatus
              return {
                id: r.id,
                businessName: r.businessName,
                customerName: r.customerName,
                menuName: r.menuName,
                vehicle: formatVehicle(r.vehicle),
                source: formatSource(r.source),
                datetime: `${r.bookingDate} ${r.startTime}`,
                status: (
                  <Badge className={BOOKING_STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-600'}>
                    {BOOKING_STATUS_LABEL[status] ?? status}
                  </Badge>
                ),
                actions: (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openDetail(r)}
                      className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                    >
                      상세보기
                    </button>
                    {!['cancelled', 'noshow', 'completed', 'paid', 'reviewed', 'expired'].includes(
                      r.status,
                    ) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelTarget(r)
                          setCancelReason('')
                        }}
                        className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50"
                      >
                        강제취소
                      </button>
                    )}
                  </div>
                ),
              }
            })}
            emptyMessage="예약이 없습니다."
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              총 {total.toLocaleString()}건 · {page}/{totalPages}페이지
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                이전
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminModal open={!!detail} onClose={() => setDetail(null)} title="예약 상세" size="lg">
        {detail && (
          <div className="space-y-4 text-sm">
            {detailLoading ? (
              <p className="text-gray-400">상세 정보를 불러오는 중...</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <DetailRow label="예약번호" value={detail.bookingNumber ?? detail.id} />
                  <DetailRow label="업체명" value={detail.businessName} />
                  <DetailRow label="고객명" value={detail.customerName} />
                  <DetailRow label="연락처" value={detail.phone || '-'} />
                  <DetailRow label="메뉴" value={detail.menuName} />
                  <DetailRow label="날짜·시간" value={`${detail.bookingDate} ${detail.startTime}`} />
                  <DetailRow label="금액" value={`${(detail.price ?? 0).toLocaleString()}원`} />
                  <DetailRow
                    label="상태"
                    value={
                      <Badge
                        className={
                          BOOKING_STATUS_STYLE[detail.status as BookingStatus] ??
                          'bg-gray-100 text-gray-600'
                        }
                      >
                        {BOOKING_STATUS_LABEL[detail.status as BookingStatus] ?? detail.status}
                      </Badge>
                    }
                  />
                  <DetailRow label="차량" value={formatVehicle(detail.vehicle)} />
                  <DetailRow label="출처" value={formatSource(detail.source)} />
                  {detail.note ? <DetailRow label="메모" value={detail.note} /> : null}
                  {detail.paymentStatus ? (
                    <DetailRow label="결제" value={`${detail.paymentStatus} · ${detail.paidAmount ?? 0}원`} />
                  ) : null}
                </div>

                {detailActions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {detailActions.map((action) => (
                      <button
                        key={action.next}
                        type="button"
                        disabled={statusLoading}
                        onClick={() => {
                          if (action.next === 'cancelled') {
                            setCancelTarget(detail)
                            setCancelReason('')
                            return
                          }
                          handleStatusChange(action.next)
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-50 ${
                          action.danger
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-4">예약 진행 상태</p>
                  <div className="flex items-start justify-between">
                    {BOOKING_TIMELINE_STEPS.map((step, idx) => {
                      const done = currentStepIdx >= idx
                      const isLast = idx === BOOKING_TIMELINE_STEPS.length - 1
                      const meta = BOOKING_STATUS_MAP[step]
                      return (
                        <div key={step} className="flex flex-col items-center flex-1 relative">
                          {!isLast && (
                            <div
                              className={`absolute top-3 left-1/2 w-full h-0.5 ${
                                currentStepIdx > idx
                                  ? 'bg-blue-500'
                                  : 'border-t-2 border-dashed border-gray-200'
                              }`}
                            />
                          )}
                          <div
                            className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              done
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span
                            className={`mt-2 text-[10px] text-center leading-tight ${
                              done ? 'text-blue-600 font-medium' : 'text-gray-400'
                            }`}
                          >
                            {meta.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </AdminModal>

      <AdminModal
        open={!!cancelTarget}
        onClose={() => {
          setCancelTarget(null)
          setCancelReason('')
        }}
        title="예약 강제 취소"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCancelTarget(null)}
              disabled={cancelLoading}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelLoading || !cancelReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {cancelLoading ? '처리 중...' : '확인'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-3">
          {cancelTarget?.customerName}님의 예약을 강제 취소합니다.
        </p>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="취소 사유를 입력하세요 (필수)"
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </AdminModal>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <div className="font-medium text-gray-900 mt-0.5">{value}</div>
    </div>
  )
}
