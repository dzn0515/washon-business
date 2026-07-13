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
  owner_id?: string
  name: string
  slug: string
  address?: string
  phone?: string | null
  biz_type?: string
  bay_count?: number
  resource_label?: string
  resource_count?: number
  status?: string
  plan?: string
  brand_color?: string
  logo_url?: string
  banner_url?: string
  monthly_fee?: number
  platform_fee_rate?: number | null
  trial_ends_at?: string | null
  subscription_status?: string | null
  next_payment_at?: string | null
  auto_renewal?: boolean | null
}

export async function fetchBusinessMe(): Promise<BusinessMe> {
  return apiFetch<BusinessMe>('/business/me')
}

export type BusinessMeUpdatePayload = {
  name?: string
  phone?: string | null
  address?: string | null
  brand_color?: string
}

/** PATCH /business/me — partial update (unset fields are not overwritten). */
export async function updateBusinessMe(payload: BusinessMeUpdatePayload): Promise<BusinessMe> {
  return apiFetch<BusinessMe>('/business/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
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

export type MenuWritePayload = {
  name: string
  description?: string | null
  category: string
  duration_minutes: number
  is_active: boolean
  is_popular?: boolean
  sort_order?: number
  prices: { vehicle_size: string; vehicle_origin: string; price: number }[]
}

export async function createMenu(payload: MenuWritePayload) {
  return apiFetch('/business/menus/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateMenu(menuId: string, payload: Partial<MenuWritePayload>) {
  return apiFetch(`/business/menus/${menuId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
