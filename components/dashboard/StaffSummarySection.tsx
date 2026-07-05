'use client'

import Link from 'next/link'
import { UserCog } from 'lucide-react'
import { fetchBusinessBookings, type ApiBooking } from '@/lib/bookings-api'
import type { DashboardTodayBooking, DashboardTodayData } from '@/lib/hooks/useDashboardToday'
import { CARD } from '@/lib/dashboard-ui'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  today: DashboardTodayData
  isLive: boolean
  isUnavailable?: boolean
  todayDate: string
}

const DONE_STATUSES = new Set(['completed', 'paid', 'reviewed'])

function completedByStaff(bookings: ApiBooking[]) {
  const map = new Map<string, { name: string; count: number }>()
  for (const b of bookings) {
    if (!DONE_STATUSES.has(b.status) || !b.staff_id) continue
    const prev = map.get(b.staff_id)
    map.set(b.staff_id, {
      name: b.staff_name ?? '직원',
      count: (prev?.count ?? 0) + 1,
    })
  }
  return map
}

function bayAssignments(bookings: DashboardTodayBooking[]) {
  const map = new Map<string, { name: string; count: number }>()
  for (const b of bookings) {
    const key = b.bay_id ?? b.bay_name ?? 'unassigned'
    const name = b.bay_name ?? '미배정'
    const prev = map.get(key)
    map.set(key, { name, count: (prev?.count ?? 0) + 1 })
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

export default function StaffSummarySection({ today, isLive, isUnavailable, todayDate }: Props) {
  const { isDemo, href } = useDemoMode()
  const [todayBookings, setTodayBookings] = useState<ApiBooking[] | null>(null)

  useEffect(() => {
    if (!isLive) {
      setTodayBookings(null)
      return
    }
    fetchBusinessBookings(todayDate)
      .then(setTodayBookings)
      .catch(() => setTodayBookings(null))
  }, [isLive, todayDate])

  const activeStaff = today.staff_summary.filter((s) => s.staff_id && s.active)
  const assignedTotal = today.staff_summary.reduce((sum, s) => sum + s.assigned_count, 0)
  const inProgress = today.status_counts.in_progress
  const completedMap = useMemo(
    () => (todayBookings ? completedByStaff(todayBookings) : null),
    [todayBookings],
  )
  const bays = useMemo(
    () => bayAssignments([...today.current_bookings, ...today.next_bookings]),
    [today.current_bookings, today.next_bookings],
  )

  if (isUnavailable) {
    return (
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-2">
          <UserCog size={16} className="text-gray-400" />
          <p className="text-[12px] text-gray-400 font-medium">직원관리 요약</p>
        </div>
        <p className="text-sm text-gray-500">직원·배정 데이터를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <UserCog size={16} className="text-blue-600" />
          <p className="text-[12px] text-gray-400 font-medium">직원관리 요약</p>
        </div>
        <Link href={href('/dashboard/operations/staff')} className="text-xs text-blue-600 font-medium">
          직원 관리
        </Link>
      </div>

      {!isLive && isDemo ? (
        <p className="text-xs text-amber-600 mb-3">데모 데이터</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">출근 직원</p>
          <p className="text-lg font-semibold text-gray-900">{activeStaff.length}명</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">배정 예약</p>
          <p className="text-lg font-semibold text-gray-900">{assignedTotal}건</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">진행 중</p>
          <p className="text-lg font-semibold text-gray-900">{inProgress}건</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">베이 사용</p>
          <p className="text-lg font-semibold text-gray-900">
            {today.bay_summary.busy_now}
            <span className="text-sm font-normal text-gray-400"> / {today.bay_summary.active}</span>
          </p>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 font-medium mb-2">직원별 담당 · 완료</p>
      <div className="space-y-2 mb-4">
        {today.staff_summary.map((s) => {
          const done = s.staff_id && completedMap ? completedMap.get(s.staff_id)?.count : undefined
          return (
            <div key={s.staff_id ?? 'unassigned'} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span
                  className={`text-sm truncate ${!s.active && s.staff_id ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  {s.name}
                  {!s.active && s.staff_id ? ' (비활성)' : ''}
                </span>
              </div>
              <span className="text-sm text-gray-600 shrink-0">
                담당 {s.assigned_count}건
                {done !== undefined ? ` · 완료 ${done}건` : ''}
              </span>
            </div>
          )
        })}
        {today.staff_summary.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 직원이 없습니다.</p>
        ) : null}
      </div>

      <p className="text-[11px] text-gray-400 font-medium mb-2">베이 배정 현황</p>
      <div className="space-y-1.5">
        {bays.length === 0 ? (
          <p className="text-sm text-gray-400">오늘 배정된 베이가 없습니다.</p>
        ) : (
          bays.map((bay) => (
            <div key={bay.name} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{bay.name}</span>
              <span className="text-gray-500">{bay.count}건</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
