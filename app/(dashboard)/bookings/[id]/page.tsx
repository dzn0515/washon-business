'use client'

import { useParams, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import BookingStatusActions from '@/components/features/bookings/BookingStatusActions'
import { useBookingDetail } from '@/lib/hooks/useBookingDetail'
import { useBays } from '@/lib/hooks/useBays'
import { useStaff } from '@/lib/hooks/useStaff'
import { useBusinessMe } from '@/lib/hooks/useBusinessMe'
import { formatResourceName, resolveResourceLabel } from '@/lib/resource-label'
import { formatMoney, formatPhone } from '@/lib/utils'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE } from '@/constants'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const bookingDate = searchParams.get('date') ?? undefined
  const {
    booking,
    loading,
    updating,
    assigningStaff,
    assigningBay,
    bayError,
    staffError,
    statusError,
    updateStatus,
    updateStaff,
    updateBay,
    updatePayment,
    updatingPayment,
    paymentError,
    isLive,
  } = useBookingDetail(id, bookingDate)
  const { bays } = useBays()
  const { staff } = useStaff()
  const { display: businessDisplay } = useBusinessMe()
  const resourceLabel = resolveResourceLabel(
    businessDisplay?.bizType,
    businessDisplay?.resourceLabel,
  )

  if (loading) return <div className="text-sm text-gray-400">로딩 중...</div>
  if (!booking) return <div className="text-sm text-gray-400">예약을 찾을 수 없습니다.</div>

  const bayOptions = bays.filter((b) => b.is_active || b.id === booking.bay?.id)
  const staffOptions = staff.filter((s) => s.is_active || s.id === booking.staff?.id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{booking.booking_number}</span>
        <Badge className={BOOKING_STATUS_STYLE[booking.status]}>{BOOKING_STATUS_LABEL[booking.status]}</Badge>
      </div>

      <Card title="고객 정보">
        <div className="text-sm space-y-1">
          <div className="font-medium">{booking.user.name}</div>
          <div className="text-gray-500">{formatPhone(booking.user.phone)}</div>
          <div className="text-gray-500">{booking.vehicle.car_number} · {booking.vehicle.car_model}</div>
        </div>
      </Card>

      <Card title="예약 정보">
        <div className="text-sm space-y-1">
          <div>{booking.service_menu.name} ({booking.service_menu.duration_minutes}분)</div>
          <div className="text-gray-500">{booking.booking_date} {booking.booking_time}</div>
          <div className="font-semibold">{formatMoney(booking.price)}</div>
          {booking.customer_request && (
            <div className="text-xs text-gray-400 mt-2">요청: {booking.customer_request}</div>
          )}
        </div>
      </Card>

      <Card title="결제">
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">결제상태</span>
            {booking.payment_status ? (
              <Badge className={PAYMENT_STATUS_STYLE[booking.payment_status]}>
                {booking.payment_method === 'ONSITE' && booking.payment_status === 'UNPAID'
                  ? '현장 결제 예정'
                  : PAYMENT_STATUS_LABEL[booking.payment_status]}
              </Badge>
            ) : null}
            {booking.payment_method === 'ONSITE' ? (
              <Badge className="bg-slate-100 text-slate-700">현장결제</Badge>
            ) : null}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">결제방법</span>
            <span>{booking.payment_method ? PAYMENT_METHOD_LABEL[booking.payment_method] : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">예약금액</span>
            <span className="font-semibold">{formatMoney(booking.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">결제금액</span>
            <span className="font-semibold">{formatMoney(booking.paid_amount ?? 0)}</span>
          </div>
          {booking.paid_at ? (
            <p className="text-xs text-gray-400">결제일시: {new Date(booking.paid_at).toLocaleString('ko-KR')}</p>
          ) : null}
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            className="flex-1"
            size="sm"
            disabled={
              updatingPayment ||
              !isLive ||
              booking.status === 'cancelled' ||
              booking.payment_status === 'PAID'
            }
            onClick={() =>
              void updatePayment({
                payment_method: 'onsite',
                payment_status: 'paid',
                paid_amount: booking.price,
              })
            }
          >
            현장결제 완료
          </Button>
          <Button
            className="flex-1"
            size="sm"
            variant="secondary"
            disabled={updatingPayment || !isLive || booking.payment_status !== 'PAID'}
            onClick={() =>
              void updatePayment({
                payment_status: 'refunded',
                paid_amount: booking.paid_amount ?? booking.price,
              })
            }
          >
            환불 처리
          </Button>
        </div>
        {booking.payment_method === 'ONSITE' && booking.payment_status === 'UNPAID' ? (
          <p className="mt-2 text-xs text-slate-600">
            현장결제 예약입니다. 방문 시 매장에서 결제받은 뒤 위 버튼으로 완료 처리할 수 있습니다.
          </p>
        ) : null}
        {booking.status === 'pending' &&
        booking.payment_status !== 'PAID' &&
        booking.payment_method !== 'ONSITE' ? (
          <p className="mt-2 text-xs text-amber-600">결제대기 · 고객 결제 완료 후 자동 확정됩니다.</p>
        ) : null}
        {updatingPayment ? <p className="text-xs text-gray-400 mt-2">처리 중...</p> : null}
        {paymentError ? <p className="text-xs text-red-600 mt-2">{paymentError}</p> : null}
      </Card>

      <Card title={`배정 ${resourceLabel}`}>
        <select
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50"
          value={booking.bay?.id ?? ''}
          disabled={assigningBay || !isLive}
          onChange={(e) => {
            const value = e.target.value
            if (value) void updateBay(value)
          }}
        >
          <option value="" disabled>{resourceLabel} 선택</option>
          {bayOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}{!b.is_active ? ' · 비활성' : ''}
            </option>
          ))}
        </select>
        {booking.bay ? (
          <p className="text-xs text-gray-400 mt-2">
            현재: {booking.bay.name} ({formatResourceName(businessDisplay?.bizType, booking.bay.number)})
          </p>
        ) : null}
        {assigningBay ? <p className="text-xs text-gray-400 mt-2">저장 중...</p> : null}
        {bayError === 'bay_conflict' ? (
          <p className="text-xs text-red-600 mt-2">해당 시간에 이미 사용 중인 {resourceLabel}입니다.</p>
        ) : null}
      </Card>

      <Card title="담당 직원">
        <div className="flex items-center gap-2">
          {booking.staff?.color ? (
            <span
              className="w-1 h-8 rounded-full shrink-0"
              style={{ backgroundColor: booking.staff.color }}
            />
          ) : null}
          <select
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50"
            value={String(booking.staff?.id ?? '')}
            disabled={assigningStaff || !isLive}
            onChange={(e) => {
              const value = e.target.value
              void updateStaff(value ? value : null)
            }}
          >
            <option value="">미배정</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.position ? ` (${s.position})` : ''}{!s.is_active ? ' · 비활성' : ''}
              </option>
            ))}
          </select>
        </div>
        {assigningStaff ? <p className="text-xs text-gray-400 mt-2">저장 중...</p> : null}
        {staffError === 'staff_conflict' ? (
          <p className="text-xs text-red-600 mt-2">해당 시간에 이미 배정된 직원입니다.</p>
        ) : null}
      </Card>

      <Card title="메모">
        <Input defaultValue={booking.memo} placeholder="사장님 메모" />
        <Button className="mt-2 w-full" size="sm">메모 저장</Button>
      </Card>

      <Card title="상태 변경">
        <BookingStatusActions
          status={booking.status}
          paymentStatus={booking.payment_status}
          disabled={updating || !isLive}
          onAction={(s) => void updateStatus(s)}
        />
        {updating ? <p className="text-xs text-gray-400 mt-2">저장 중...</p> : null}
        {statusError ? (
          <p className="text-xs text-red-600 mt-2">변경할 수 없는 상태입니다.</p>
        ) : null}
      </Card>
    </div>
  )
}
