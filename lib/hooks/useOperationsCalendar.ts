'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  createBayUnavailable,
  createScheduleException,
  createStaffUnavailable,
  deleteBayUnavailable,
  deleteScheduleException,
  deleteStaffUnavailable,
  fetchBayUnavailable,
  fetchScheduleExceptions,
  fetchStaffUnavailable,
  monthBounds,
  type BayUnavailable,
  type ScheduleException,
  type StaffUnavailable,
} from '@/lib/schedule-api'

export type DayItem =
  | { kind: 'schedule'; data: ScheduleException }
  | { kind: 'bay'; data: BayUnavailable }
  | { kind: 'staff'; data: StaffUnavailable }

export function useOperationsCalendar(year: number, month: number) {
  const [schedule, setSchedule] = useState<ScheduleException[] | null>(null)
  const [bayUnavailable, setBayUnavailable] = useState<BayUnavailable[] | null>(null)
  const [staffUnavailable, setStaffUnavailable] = useState<StaffUnavailable[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { start, end } = monthBounds(year, month)
    try {
      const [s, b, st] = await Promise.all([
        fetchScheduleExceptions(start, end),
        fetchBayUnavailable(start, end),
        fetchStaffUnavailable(start, end),
      ])
      setSchedule(s)
      setBayUnavailable(b)
      setStaffUnavailable(st)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSchedule(null)
      setBayUnavailable(null)
      setStaffUnavailable(null)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    void load()
  }, [load])

  const datesWithItems = new Set<string>()
  for (const row of schedule ?? []) datesWithItems.add(row.date)
  for (const row of bayUnavailable ?? []) datesWithItems.add(row.date)
  for (const row of staffUnavailable ?? []) datesWithItems.add(row.date)

  function itemsForDate(date: string): DayItem[] {
    const items: DayItem[] = []
    for (const row of schedule ?? []) {
      if (row.date === date) items.push({ kind: 'schedule', data: row })
    }
    for (const row of bayUnavailable ?? []) {
      if (row.date === date) items.push({ kind: 'bay', data: row })
    }
    for (const row of staffUnavailable ?? []) {
      if (row.date === date) items.push({ kind: 'staff', data: row })
    }
    return items
  }

  return {
    schedule: schedule ?? [],
    bayUnavailable: bayUnavailable ?? [],
    staffUnavailable: staffUnavailable ?? [],
    loading,
    error,
    isLive: schedule !== null,
    refetch: load,
    datesWithItems,
    itemsForDate,
    createScheduleException,
    addHoliday: async (date: string, reason?: string) => {
      await createScheduleException({ date, type: 'holiday', reason })
      await load()
    },
    addHours: async (date: string, start_time: string, end_time: string, reason?: string) => {
      await createScheduleException({ date, type: 'hours', start_time, end_time, reason })
      await load()
    },
    addBlocked: async (date: string, start_time: string, end_time: string, reason?: string) => {
      await createScheduleException({ date, type: 'blocked', start_time, end_time, reason })
      await load()
    },
    addBayUnavailable: async (data: Parameters<typeof createBayUnavailable>[0]) => {
      await createBayUnavailable(data)
      await load()
    },
    addStaffUnavailable: async (data: Parameters<typeof createStaffUnavailable>[0]) => {
      await createStaffUnavailable(data)
      await load()
    },
    removeSchedule: async (id: string) => {
      await deleteScheduleException(id)
      await load()
    },
    removeBayUnavailable: async (id: string) => {
      await deleteBayUnavailable(id)
      await load()
    },
    removeStaffUnavailable: async (id: string) => {
      await deleteStaffUnavailable(id)
      await load()
    },
  }
}
