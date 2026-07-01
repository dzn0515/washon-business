import { apiFetch } from '@/lib/api-client'

export type StaffPayload = {
  name: string
  phone?: string | null
  position?: string | null
  color?: string
  sort_order: number
  is_active?: boolean
}

export type StaffUpdatePayload = {
  name?: string
  phone?: string | null
  position?: string | null
  color?: string
  sort_order?: number
}

export async function createStaff(data: StaffPayload) {
  return apiFetch('/business/staff/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateStaff(staffId: string, data: StaffUpdatePayload) {
  return apiFetch(`/business/staff/${staffId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function setStaffActive(staffId: string, is_active: boolean) {
  return apiFetch(`/business/staff/${staffId}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  })
}
