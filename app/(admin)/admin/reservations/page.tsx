'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import Badge from '@/components/ui/Badge'
import {
  fetchAdminAllReservations,
  forceCancelReservation,
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
  { key: 'in_progress', label: '작업중' },
  { key: 'completed', label: '완료' },
  { key: 'cancelled', label: '취소' },
  { key: 'noshow', label: '노쇼' },
]

function formatVehicle(v: AdminReservationItem['vehicle']): string {
  if (!v) return '-'
  const parts = [v.brand, v.model].filter(Boolean).join(' ')
  return parts ? `${parts} · ${v.licensePlate}` : v.licensePlate
}

function formatSource(source: string | null): string {
  if (!source) return '-'
  return RESERVATION_SOURCE_LABEL[source] ?? source
}

export default function AdminReservationsPage() {
  const { showToast, ToastComponent } = useToast()
  const [statusTab, setStatusTab] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [reservations, setReservations] = useState<AdminReservationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [detail, setDetail] = useState<AdminReservationItem | null>(null)
  const [cancelTarget, setCancelTarget] = useState<AdminReservationItem | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdminAllReservations({
        status: statusTab,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search,
      })
      setReservations(data)
    } catch {
      setError(true)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }, [statusTab, dateFrom, dateTo, search])

  useEffect(() => {
    load()
  }, [load])

  const handleCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return
    setCancelLoading(true)
    try {
      await forceCancelReservation(cancelTarget.id, cancelReason)
      showToast('예약이 취소되었습니다.', 'success')
      setCancelTarget(null)
      setCancelReason('')
      load()
    } catch {
      showToast('취소 처리에 실패했습니다.', 'error')
    } finally {
      setCancelLoading(false)
    }
  }

  const currentStepIdx = detail ? getTimelineStepIndex(detail.status) : -1

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader title="예약 관리" description="플랫폼 전체 예약 조회 및 관리" />

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
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
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-end bg-white border border-gray-200 rounded-xl p-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">시작일</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">종료일</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-400 mb-1">검색</label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
            placeholder="업체명, 고객명"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setSearch(searchInput)}
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
                      onClick={() => setDetail(r)}
                      className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                    >
                      상세보기
                    </button>
                    {!['cancelled', 'noshow', 'completed', 'paid', 'reviewed'].includes(
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
        </div>
      )}

      {/* 예약 상세 모달 */}
      <AdminModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="예약 상세"
        size="lg"
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="예약번호" value={detail.id} />
              <DetailRow label="업체명" value={detail.businessName} />
              <DetailRow label="고객명" value={detail.customerName} />
              <DetailRow label="메뉴" value={detail.menuName} />
              <DetailRow label="날짜·시간" value={`${detail.bookingDate} ${detail.startTime}`} />
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
            </div>

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
                            currentStepIdx > idx ? 'bg-blue-500' : 'border-t-2 border-dashed border-gray-200'
                          }`}
                        />
                      )}
                      <div
                        className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          done ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className={`mt-2 text-[10px] text-center leading-tight ${done ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        {meta.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* 강제취소 모달 */}
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
