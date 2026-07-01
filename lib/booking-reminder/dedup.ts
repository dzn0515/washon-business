import type { ReminderStage } from '@/lib/booking-reminder/types'

const STORAGE_KEY = 'washon-booking-reminder-fired'

type FiredMap = Record<string, number>

function readMap(): FiredMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as FiredMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeMap(map: FiredMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

function dedupKey(bookingId: string, stage: ReminderStage, bookingDate: string): string {
  return `${bookingId}:${stage}:${bookingDate}`
}

export function hasReminderFired(
  bookingId: string,
  stage: ReminderStage,
  bookingDate: string,
): boolean {
  const map = readMap()
  return Boolean(map[dedupKey(bookingId, stage, bookingDate)])
}

export function markReminderFired(
  bookingId: string,
  stage: ReminderStage,
  bookingDate: string,
): void {
  const map = readMap()
  map[dedupKey(bookingId, stage, bookingDate)] = Date.now()
  const cutoff = Date.now() - 48 * 60 * 60 * 1000
  for (const [key, ts] of Object.entries(map)) {
    if (ts < cutoff) delete map[key]
  }
  writeMap(map)
}
