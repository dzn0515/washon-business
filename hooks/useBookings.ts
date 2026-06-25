'use client'
import useSWR from 'swr'
import { mockApi } from '@/lib/mock/data'
import type { BookingStatus } from '@/types'

export function useBookings(filters?: { status?: BookingStatus | 'ALL'; date?: string }) {
  return useSWR(['bookings', filters], () => mockApi.getBookings(filters))
}

export function useBooking(id: number) {
  return useSWR(id ? ['booking', id] : null, () => mockApi.getBooking(id))
}
