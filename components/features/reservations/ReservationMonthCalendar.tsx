'use client'

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ko } from 'date-fns/locale'

type DayCount = { total: number; confirmed: number; pending: number }

type Props = {
  month: string
  selectedDate: string
  counts: Record<string, DayCount>
  onSelectDate: (iso: string) => void
  onMonthChange: (ym: string) => void
}

export default function ReservationMonthCalendar({
  month,
  selectedDate,
  counts,
  onSelectDate,
  onMonthChange,
}: Props) {
  const [y, m] = month.split('-').map(Number)
  const monthDate = new Date(y, m - 1, 1)
  const selected = parseISO(`${selectedDate}T12:00:00`)
  const today = new Date()

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 }),
  })

  const shiftMonth = (delta: number) => {
    const d = addDays(startOfMonth(monthDate), delta > 0 ? 32 : -1)
    onMonthChange(format(d, 'yyyy-MM'))
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-lg border border-gray-200 px-2.5 py-1 text-sm text-gray-600 hover:bg-gray-50"
        >
          이전
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">
            {format(monthDate, 'yyyy년 M월', { locale: ko })}
          </p>
          <button
            type="button"
            onClick={() => {
              const iso = format(today, 'yyyy-MM-dd')
              onMonthChange(format(today, 'yyyy-MM'))
              onSelectDate(iso)
            }}
            className="mt-0.5 text-[11px] text-blue-600 hover:underline"
          >
            오늘로 이동
          </button>
        </div>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-lg border border-gray-200 px-2.5 py-1 text-sm text-gray-600 hover:bg-gray-50"
        >
          다음
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-400 mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd')
          const c = counts[iso]
          const inMonth = isSameMonth(day, monthDate)
          const isSelected = isSameDay(day, selected)
          const isToday = isSameDay(day, today)
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={`min-h-[3.25rem] rounded-lg px-0.5 py-1 text-sm flex flex-col items-center ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : inMonth
                    ? 'hover:bg-gray-50 text-gray-800'
                    : 'text-gray-300'
              } ${isToday && !isSelected ? 'ring-1 ring-blue-300' : ''}`}
            >
              <span className="leading-none">{format(day, 'd')}</span>
              {c && c.total > 0 ? (
                <span
                  className={`mt-1 flex gap-0.5 text-[9px] leading-none ${
                    isSelected ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {c.confirmed > 0 ? (
                    <span className={isSelected ? 'text-white' : 'text-blue-600'}>
                      {c.confirmed}
                    </span>
                  ) : null}
                  {c.pending > 0 ? (
                    <span className={isSelected ? 'text-amber-100' : 'text-amber-600'}>
                      +{c.pending}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="mt-1 h-2" />
              )}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-gray-400 text-center">
        파란 숫자 = 확정 · 노란 +N = 결제대기
      </p>
    </div>
  )
}
