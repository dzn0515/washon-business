'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api-client'
import { pricesToGrid } from '@/lib/api-mappers'
import { calcPriceGrid } from '@/lib/dashboard-ui'
import { isDemoMode } from '@/lib/demo-mode'
import { mockBusinessHours, mockHolidaysList, mockMenus } from '@/lib/mock/data'
import type { BusinessHours } from '@/types'

type ApiMenu = {
  id: string
  name: string
  description?: string | null
  category?: string | null
  duration_minutes: number
  is_active: boolean
  is_popular: boolean
  prices?: { vehicle_size: string; vehicle_origin: string; price: number }[]
}

type ApiHours = {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

type ApiHoliday = {
  id: string
  start_date: string
  end_date: string
  reason: string | null
  type: string
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

const EMPTY_MENUS: MenuCard[] = []
const EMPTY_HOURS: BusinessHours[] = []
const EMPTY_HOLIDAYS: HolidayCard[] = []

export type MenuCard = {
  id: number
  apiId: string
  name: string
  description: string | null
  category: string | null
  duration_minutes: number
  monthly_bookings: number
  is_popular: boolean
  is_active: boolean
  price_grid: ReturnType<typeof pricesToGrid>
}

type HolidayCard = {
  id: number
  date: string
  reason: string
  type: 'HOLIDAY' | 'RAIN'
}

function mapApiMenus(apiMenus: ApiMenu[]): MenuCard[] {
  return apiMenus.map((m, i) => ({
    id: i + 1,
    apiId: m.id,
    name: m.name,
    description: m.description ?? null,
    category: m.category ?? null,
    duration_minutes: m.duration_minutes,
    monthly_bookings: 0,
    is_popular: m.is_popular,
    is_active: m.is_active,
    price_grid: pricesToGrid(m.prices ?? []),
  }))
}

function mapApiHours(apiHours: ApiHours[]): BusinessHours[] {
  const byDay = new Map(apiHours.map((h) => [h.day_of_week, h]))
  return DAY_LABELS.map((label, day) => {
    const h = byDay.get(day)
    return {
      day,
      label,
      is_open: h ? !h.is_closed : false,
      open_time: (h?.open_time ?? '09:00').slice(0, 5),
      close_time: (h?.close_time ?? '18:00').slice(0, 5),
    }
  })
}

function mapApiHolidays(apiHolidays: ApiHoliday[]): HolidayCard[] {
  return apiHolidays.map((h, i) => ({
    id: i + 1,
    date: h.start_date === h.end_date ? h.start_date : `${h.start_date} ~ ${h.end_date}`,
    reason: h.reason ?? '휴무',
    type: h.type === 'rain' ? 'RAIN' : 'HOLIDAY',
  }))
}

const DEMO_MENUS: MenuCard[] = mockMenus.map((m, i) => ({
  id: i + 1,
  apiId: String(i + 1),
  name: m.name,
  description: null,
  category: null,
  duration_minutes: m.duration_minutes,
  monthly_bookings: 0,
  is_popular: false,
  is_active: m.is_active,
  price_grid: calcPriceGrid(m.base_price),
}))

const DEMO_HOLIDAYS: HolidayCard[] = mockHolidaysList.map((h) => ({
  id: h.id,
  date: h.date,
  reason: h.reason,
  type: 'HOLIDAY' as const,
}))

export function useMenus() {
  const [menus, setMenus] = useState<MenuCard[] | null>(null)
  const [hours, setHours] = useState<BusinessHours[] | null>(null)
  const [holidays, setHolidays] = useState<HolidayCard[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [hoursSaving, setHoursSaving] = useState(false)
  const [hoursSaveError, setHoursSaveError] = useState<string | null>(null)
  const [hoursSaveOk, setHoursSaveOk] = useState(false)

  const refreshMenus = useCallback(() => {
    setReloadKey((k) => k + 1)
  }, [])

  const saveHours = useCallback(
    async (rows: BusinessHours[]) => {
      if (isDemoMode()) return false
      setHoursSaving(true)
      setHoursSaveError(null)
      setHoursSaveOk(false)
      try {
        for (const row of rows) {
          if (row.is_open && row.open_time >= row.close_time) {
            setHoursSaveError(`${row.label}: 시작 시간은 종료 시간보다 빨라야 합니다.`)
            return false
          }
        }
        const payload = {
          hours: rows.map((h) => ({
            day_of_week: h.day,
            open_time: h.open_time,
            close_time: h.close_time,
            is_closed: !h.is_open,
          })),
        }
        const saved = await apiFetch<ApiHours[]>('/business/hours', {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setHours(mapApiHours(saved))
        setHoursSaveOk(true)
        return true
      } catch (e) {
        setHoursSaveError(e instanceof Error ? e.message : '영업시간 저장에 실패했습니다.')
        return false
      } finally {
        setHoursSaving(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (isDemoMode()) {
      setMenus(DEMO_MENUS)
      setHours(mockBusinessHours)
      setHolidays(DEMO_HOLIDAYS)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    let finished = false

    const finish = () => {
      if (cancelled || finished) return
      finished = true
      setLoading(false)
    }

    const safetyTimer = window.setTimeout(finish, 15_000)

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [menusResult, hoursResult, holidaysResult] = await Promise.allSettled([
          apiFetch<ApiMenu[]>('/business/menus/?include_inactive=true'),
          apiFetch<ApiHours[]>('/business/hours'),
          apiFetch<ApiHoliday[]>('/business/holidays'),
        ])

        if (cancelled) return

        const failures: string[] = []

        if (menusResult.status === 'fulfilled') {
          setMenus(mapApiMenus(menusResult.value))
        } else {
          setMenus(null)
          failures.push('메뉴')
        }

        if (hoursResult.status === 'fulfilled') {
          setHours(mapApiHours(hoursResult.value))
        } else {
          setHours([])
          failures.push('영업시간')
        }

        if (holidaysResult.status === 'fulfilled') {
          setHolidays(mapApiHolidays(holidaysResult.value))
        } else {
          setHolidays(EMPTY_HOLIDAYS)
        }

        if (failures.length > 0) {
          setError(`${failures.join('·')} 정보를 불러올 수 없습니다.`)
        }
      } finally {
        window.clearTimeout(safetyTimer)
        finish()
      }
    }

    void load()

    return () => {
      cancelled = true
      window.clearTimeout(safetyTimer)
    }
  }, [reloadKey])

  return useMemo(
    () => ({
      menus: menus ?? EMPTY_MENUS,
      hours: hours ?? EMPTY_HOURS,
      holidays: holidays ?? EMPTY_HOLIDAYS,
      loading,
      error,
      isLive: menus !== null,
      refreshMenus,
      saveHours,
      hoursSaving,
      hoursSaveError,
      hoursSaveOk,
    }),
    [
      menus,
      hours,
      holidays,
      loading,
      error,
      refreshMenus,
      saveHours,
      hoursSaving,
      hoursSaveError,
      hoursSaveOk,
    ],
  )
}
