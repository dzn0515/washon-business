import { apiFetch } from '@/lib/api-client'

export type BayPayload = {
  name: string
  sort_order: number
  is_active?: boolean
}

export type BayUpdatePayload = {
  name?: string
  sort_order?: number
}

export async function createBay(data: BayPayload) {
  return apiFetch('/business/bays/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateBay(bayId: string, data: BayUpdatePayload) {
  return apiFetch(`/business/bays/${bayId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function setBayActive(bayId: string, is_active: boolean) {
  return apiFetch(`/business/bays/${bayId}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  })
}
