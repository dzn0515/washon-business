import type { AdProduct } from './catalog'
import { isExposureProductId } from '@/lib/billing/ad-product-selection'
import {
  submitBusinessAdApplications,
  type BusinessAdApplicationRow,
} from '@/lib/ad-applications/business-api'
import { checkoutSaasAd } from '@/lib/saas-billing-api'

export type ApplyAdProductResult = {
  success: boolean
  items: AdProduct[]
  applications?: BusinessAdApplicationRow[]
}

export async function handleApplyAdProduct(
  items: AdProduct[],
  opts?: { billingMethodId?: number; authKey?: string; customerKey?: string },
): Promise<ApplyAdProductResult> {
  if (items.length === 0) {
    return { success: false, items: [] }
  }

  const exposure = items.filter((p) => isExposureProductId(p.id))
  const others = items.filter((p) => !isExposureProductId(p.id))
  let billingMethodId = opts?.billingMethodId
  let authKey = opts?.authKey

  for (const product of exposure) {
    const result = await checkoutSaasAd({
      product_id: product.id,
      billing_method_id: billingMethodId,
      auth_key: authKey,
      customer_key: opts?.customerKey,
    })
    billingMethodId = result.billing_method.id
    authKey = undefined
  }

  let applications: BusinessAdApplicationRow[] | undefined
  if (others.length > 0) {
    applications = await submitBusinessAdApplications(others.map((p) => p.id))
  }

  return { success: true, items, applications }
}
