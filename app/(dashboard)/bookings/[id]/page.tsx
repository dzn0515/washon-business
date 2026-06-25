'use client'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { mockApi } from '@/lib/mock/data'
import { formatMoney, formatPhone } from '@/lib/utils'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE } from '@/constants'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: booking } = useSWR(['booking', id], () => mockApi.getBooking(Number(id)))
  const { data: staff } = useSWR('staff', () => mockApi.getStaff())

  if (!booking) return <div className="text-sm text-gray-400">로딩 중...</div>

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

      <Card title="직원 배정">
        <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" defaultValue={booking.staff?.id ?? ''}>
          <option value="">미배정</option>
          {staff?.filter((s) => s.is_active).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </Card>

      <Card title="메모">
        <Input defaultValue={booking.memo} placeholder="사장님 메모" />
        <Button className="mt-2 w-full" size="sm">메모 저장</Button>
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1">완료 처리</Button>
        <Button className="flex-1" variant="danger">노쇼</Button>
        <Button className="flex-1" variant="secondary">취소</Button>
      </div>
    </div>
  )
}
