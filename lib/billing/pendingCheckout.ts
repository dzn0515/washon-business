const KEY = 'autoon_saas_checkout'

export type PendingSaasCheckout =
  | { kind: 'subscription'; planId: string; autoRenewal: boolean }
  | { kind: 'ad'; productIds: string[]; applicationProductIds?: string[] }

export function savePendingSaasCheckout(payload: PendingSaasCheckout): void {
  sessionStorage.setItem(KEY, JSON.stringify(payload))
}

export function readPendingSaasCheckout(): PendingSaasCheckout | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingSaasCheckout
    if (parsed?.kind === 'subscription' || parsed?.kind === 'ad') return parsed
    return null
  } catch {
    return null
  }
}

export function clearPendingSaasCheckout(): void {
  sessionStorage.removeItem(KEY)
}
