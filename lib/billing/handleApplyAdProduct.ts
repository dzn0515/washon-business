import type { AdProduct } from './catalog'
import {
  submitBusinessAdApplications,
  type BusinessAdApplicationRow,
} from '@/lib/ad-applications/business-api'

export type ApplyAdProductResult = {
  success: boolean
  items: AdProduct[]
  applications?: BusinessAdApplicationRow[]
}

export async function handleApplyAdProduct(items: AdProduct[]): Promise<ApplyAdProductResult> {
  if (items.length === 0) {
    return { success: false, items: [] }
  }

  const applications = await submitBusinessAdApplications(items.map((p) => p.id))
  return { success: true, items, applications }
}
