import { apiFetch } from '@/lib/api-client'

export type ScheduleExceptionType = 'holiday' | 'hours' | 'blocked'

export type ScheduleException = {
  id: string
  business_id: string
  date: string
  type: ScheduleExceptionType
  start_time: string | null
  end_time: string | null
  reason: string | null
}

export type BayUnavailable = {
  id: string
  bay_id: string
  bay_name: string | null
  date: string
  start_time: string
  end_time: string
  reason: string | null
}

export type StaffUnavailable = {
  id: string
  staff_id: string
  staff_name: string | null
  date: string
  start_time: string
  end_time: string
  reason: string | null
}

function rangeQuery(start: string, end: string) {
  return `?start_date=${start}&end_date=${end}`
}

export async function fetchScheduleExceptions(start: string, end: string) {
  return apiFetch<ScheduleException[]>(`/business/schedule${rangeQuery(start, end)}`)
}

export async function createScheduleException(data: {
  date: string
  type: ScheduleExceptionType
  start_time?: string
  end_time?: string
  reason?: string
}) {
  return apiFetch<ScheduleException>('/business/schedule', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateScheduleException(
  id: string,
  data: Partial<{
    date: string
    type: ScheduleExceptionType
    start_time: string | null
    end_time: string | null
    reason: string | null
  }>,
) {
  return apiFetch<ScheduleException>(`/business/schedule/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteScheduleException(id: string) {
  return apiFetch<void>(`/business/schedule/${id}`, { method: 'DELETE' })
}

export async function fetchBayUnavailable(start: string, end: string) {
  return apiFetch<BayUnavailable[]>(`/business/bays/unavailable${rangeQuery(start, end)}`)
}

export async function createBayUnavailable(data: {
  bay_id: string
  date: string
  start_time: string
  end_time: string
  reason?: string
}) {
  return apiFetch<BayUnavailable>('/business/bays/unavailable', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteBayUnavailable(id: string) {
  return apiFetch<void>(`/business/bays/unavailable/${id}`, { method: 'DELETE' })
}

export async function fetchStaffUnavailable(start: string, end: string) {
  return apiFetch<StaffUnavailable[]>(`/business/staff/unavailable${rangeQuery(start, end)}`)
}

export async function createStaffUnavailable(data: {
  staff_id: string
  date: string
  start_time: string
  end_time: string
  reason?: string
}) {
  return apiFetch<StaffUnavailable>('/business/staff/unavailable', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteStaffUnavailable(id: string) {
  return apiFetch<void>(`/business/staff/unavailable/${id}`, { method: 'DELETE' })
}

export function monthBounds(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export function formatTimeShort(t: string | null) {
  if (!t) return ''
  return t.slice(0, 5)
}
