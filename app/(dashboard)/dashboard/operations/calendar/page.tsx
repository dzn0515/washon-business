'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import OperationsSubNav from '@/components/features/operations/OperationsSubNav'
import Modal from '@/components/ui/Modal'
import { useBays } from '@/lib/hooks/useBays'
import { useStaff } from '@/lib/hooks/useStaff'
import { useOperationsCalendar, type DayItem } from '@/lib/hooks/useOperationsCalendar'
import { formatTimeShort } from '@/lib/schedule-api'
import { CARD, BTN_PRIMARY } from '@/lib/dashboard-ui'
import { cn } from '@/lib/utils'

type AddType = 'holiday' | 'hours' | 'blocked' | 'bay' | 'staff'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function itemLabel(item: DayItem): string {
  if (item.kind === 'schedule') {
    const { type, start_time, end_time, reason } = item.data
    if (type === 'holiday') return reason ? `휴무 · ${reason}` : '휴무'
    if (type === 'hours') return `영업 ${formatTimeShort(start_time)}~${formatTimeShort(end_time)}`
    return `예약 차단 ${formatTimeShort(start_time)}~${formatTimeShort(end_time)}`
  }
  if (item.kind === 'bay') {
    const name = item.data.bay_name ?? '베이'
    return `${name} 점검 ${formatTimeShort(item.data.start_time)}~${formatTimeShort(item.data.end_time)}`
  }
  const name = item.data.staff_name ?? '직원'
  return `${name} 휴무 ${formatTimeShort(item.data.start_time)}~${formatTimeShort(item.data.end_time)}`
}

function itemBadgeClass(item: DayItem): string {
  if (item.kind === 'schedule') {
    if (item.data.type === 'holiday') return 'bg-red-50 text-red-700 border-red-100'
    if (item.data.type === 'hours') return 'bg-blue-50 text-blue-700 border-blue-100'
    return 'bg-amber-50 text-amber-800 border-amber-100'
  }
  if (item.kind === 'bay') return 'bg-purple-50 text-purple-700 border-purple-100'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

export default function OperationsCalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [addType, setAddType] = useState<AddType>('holiday')
  const [reason, setReason] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('12:00')
  const [bayId, setBayId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    loading,
    isLive,
    error,
    refetch,
    datesWithItems,
    itemsForDate,
    addHoliday,
    addHours,
    addBlocked,
    addBayUnavailable,
    addStaffUnavailable,
    removeSchedule,
    removeBayUnavailable,
    removeStaffUnavailable,
  } = useOperationsCalendar(year, month)

  const { bays } = useBays()
  const { staff } = useStaff()

  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0).getDate()
    const startPad = first.getDay()
    const out: { date: string | null; day: number | null }[] = []
    for (let i = 0; i < startPad; i++) out.push({ date: null, day: null })
    for (let d = 1; d <= lastDay; d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      out.push({ date, day: d })
    }
    return out
  }, [year, month])

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }

  function openAdd() {
    setAddType('holiday')
    setReason('')
    setStartTime('10:00')
    setEndTime('12:00')
    setBayId(bays[0]?.id ? String(bays[0].id) : '')
    setStaffId(staff[0]?.id ? String(staff[0].id) : '')
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setFormError(null)
    try {
      const st = `${startTime}:00`
      const et = `${endTime}:00`
      if (addType === 'holiday') {
        await addHoliday(selectedDate, reason || undefined)
      } else if (addType === 'hours') {
        await addHours(selectedDate, st, et, reason || undefined)
      } else if (addType === 'blocked') {
        await addBlocked(selectedDate, st, et, reason || undefined)
      } else if (addType === 'bay') {
        if (!bayId) throw new Error('베이를 선택해주세요.')
        await addBayUnavailable({
          bay_id: bayId,
          date: selectedDate,
          start_time: st,
          end_time: et,
          reason: reason || undefined,
        })
      } else {
        if (!staffId) throw new Error('직원을 선택해주세요.')
        await addStaffUnavailable({
          staff_id: staffId,
          date: selectedDate,
          start_time: st,
          end_time: et,
          reason: reason || undefined,
        })
      }
      setModalOpen(false)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item: DayItem) {
    if (!isLive) return
    try {
      if (item.kind === 'schedule') await removeSchedule(item.data.id)
      else if (item.kind === 'bay') await removeBayUnavailable(item.data.id)
      else await removeStaffUnavailable(item.data.id)
    } catch (e) {
      console.log('[operations-calendar] delete failed', e)
    }
  }

  const dayItems = itemsForDate(selectedDate)
  const [, sm, sd] = selectedDate.split('-').map(Number)
  const selectedLabel = `${sm}월 ${sd}일`

  return (
    <div className="space-y-4">
      <OperationsSubNav />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">운영 캘린더</h2>
          <p className="text-xs text-gray-400 mt-1">휴무·영업시간·예약 차단·베이 점검·직원 휴무를 날짜별로 관리합니다.</p>
        </div>
        <button type="button" onClick={openAdd} className={`${BTN_PRIMARY} flex items-center gap-1 shrink-0`}>
          <Plus size={14} /> 추가
        </button>
      </div>

      {!isLive && !loading && error ? (
        <p className="text-xs text-amber-600">API 연결 실패 — 로그인 상태를 확인해주세요.</p>
      ) : null}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className={CARD}>
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => shiftMonth(-1)} className="p-1 rounded hover:bg-gray-100">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-900">{year}년 {month}월</span>
            <button type="button" onClick={() => shiftMonth(1)} className="p-1 rounded hover:bg-gray-100">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[11px] text-gray-400 font-medium py-1">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell.date || cell.day === null) {
                return <div key={`empty-${i}`} className="aspect-square" />
              }
              const hasItems = datesWithItems.has(cell.date)
              const selected = cell.date === selectedDate
              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => setSelectedDate(cell.date!)}
                  className={cn(
                    'aspect-square rounded-lg text-sm flex flex-col items-center justify-center border transition-colors',
                    selected ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'border-transparent hover:bg-gray-50 text-gray-700',
                  )}
                >
                  {cell.day}
                  {hasItems ? <span className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" /> : null}
                </button>
              )
            })}
          </div>

          {loading ? <p className="text-xs text-gray-400 mt-3">불러오는 중...</p> : null}
          <button type="button" onClick={() => void refetch()} className="text-xs text-blue-600 mt-2">
            새로고침
          </button>
        </div>

        <div className={CARD}>
          <p className="text-sm font-semibold text-gray-900 mb-3">{selectedLabel}</p>
          {dayItems.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 운영 일정이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {dayItems.map((item) => (
                <li
                  key={`${item.kind}-${item.data.id}`}
                  className={cn('text-xs px-3 py-2 rounded-lg border flex items-start justify-between gap-2', itemBadgeClass(item))}
                >
                  <span>{itemLabel(item)}</span>
                  {isLive ? (
                    <button type="button" onClick={() => void handleDelete(item)} className="shrink-0 opacity-60 hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${selectedLabel} 일정 추가`}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">유형</label>
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as AddType)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="holiday">휴무</option>
              <option value="hours">영업시간 변경</option>
              <option value="blocked">예약 차단</option>
              <option value="bay">베이 점검</option>
              <option value="staff">직원 휴무</option>
            </select>
          </div>

          {(addType === 'hours' || addType === 'blocked' || addType === 'bay' || addType === 'staff') && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">시작</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">종료</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
              </div>
            </div>
          )}

          {addType === 'bay' && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">베이</label>
              <select value={bayId} onChange={(e) => setBayId(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                {bays.map((b) => (
                  <option key={String(b.id)} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {addType === 'staff' && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">직원</label>
              <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                {staff.map((s) => (
                  <option key={String(s.id)} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 block mb-1">메모 (선택)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder="사유" />
          </div>

          {formError ? <p className="text-xs text-red-600">{formError}</p> : null}

          <button type="button" disabled={saving} onClick={() => void handleSave()} className={`${BTN_PRIMARY} w-full`}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
