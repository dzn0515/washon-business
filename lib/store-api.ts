import { apiFetch } from '@/lib/api-client'
import { mapBookingStatusToApi } from '@/lib/api-mappers'
import type { BookingStatus, Vehicle, VehicleRecord } from '@/types'

export type GroupedMenuItem = {
  id: string
  name: string
  category: string | null
  price: number
  duration_minutes: number
  is_active: boolean
}

export type BusinessMe = {
  id: string
  name: string
  slug: string
}

export async function fetchBusinessMe(): Promise<BusinessMe> {
  return apiFetch<BusinessMe>('/business/me')
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<unknown> {
  return apiFetch(`/business/bookings/${bookingId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: mapBookingStatusToApi(status) }),
  })
}

export async function getStoreVehicles(storeId: string): Promise<Vehicle[]> {
  return apiFetch<Vehicle[]>(`/stores/${storeId}/vehicles`)
}

export async function getVehicleRecords(vehicleId: string): Promise<VehicleRecord[]> {
  return apiFetch<VehicleRecord[]>(`/vehicles/${vehicleId}/records`)
}

export type VehicleRecordCreatePayload = {
  service_type: string
  mileage?: number
  photos?: string[]
  memo?: string
  next_service_date?: string
}

export async function createVehicleRecord(
  vehicleId: string,
  data: VehicleRecordCreatePayload,
): Promise<VehicleRecord> {
  return apiFetch<VehicleRecord>(`/vehicles/${vehicleId}/records`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getMenusGrouped(
  storeId: string,
): Promise<Record<string, GroupedMenuItem[]>> {
  return apiFetch<Record<string, GroupedMenuItem[]>>(`/stores/${storeId}/menus/grouped`)
}

export async function updateMenuCategory(menuId: string, category: string): Promise<unknown> {
  return apiFetch(`/business/menus/${menuId}`, {
    method: 'PUT',
    body: JSON.stringify({ category }),
  })
}
