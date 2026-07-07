import {
  getMenuFormConfig,
  resolvePrimaryPrice,
  serializeMenuDescription,
  toApiCategory,
  type MenuFormExtras,
} from '@/lib/menu-form-config'
import { applyMenuBasePrice, gridToApiPrices } from '@/lib/menu-form'
import type { PriceGrid } from '@/lib/dashboard-ui'

export type MenuPriceItemPayload = {
  vehicle_size: 'small' | 'medium' | 'large'
  vehicle_origin: 'domestic' | 'imported'
  price: number
}

export type MenuCreatePayload = {
  name: string
  description: string | null
  category: string
  duration_minutes: number
  is_active: boolean
  is_popular: boolean
  sort_order: number
  prices: MenuPriceItemPayload[]
}

export function buildMenuPrices(
  bizType: string,
  formConfig: ReturnType<typeof getMenuFormConfig>,
  formBasePrice: number,
  formPrices: PriceGrid,
  formExtras: MenuFormExtras,
): MenuPriceItemPayload[] {
  if (formConfig.showVehicleGrid) {
    return gridToApiPrices(formPrices) as MenuPriceItemPayload[]
  }
  const primary = resolvePrimaryPrice(formConfig, formBasePrice, formExtras)
  const grid = applyMenuBasePrice(primary > 0 ? primary : formBasePrice, bizType)
  return gridToApiPrices(grid) as MenuPriceItemPayload[]
}

export function buildMenuPayload(input: {
  name: string
  duration: number
  visible: boolean
  formCategory: string
  pricingBizType: string
  formBasePrice: number
  formPrices: PriceGrid
  formExtras: MenuFormExtras
  existingDescription?: string | null
}): MenuCreatePayload {
  const formConfig = getMenuFormConfig(input.pricingBizType, input.formCategory)
  const primary = resolvePrimaryPrice(formConfig, input.formBasePrice, input.formExtras)
  const metaPayload: MenuFormExtras = {
    ...input.formExtras,
    _formCategory: input.formCategory,
  }
  const description = serializeMenuDescription(metaPayload, input.existingDescription) || null

  return {
    name: input.name.trim(),
    description,
    category: toApiCategory(input.pricingBizType, input.formCategory),
    duration_minutes: Math.max(1, input.duration),
    is_active: input.visible,
    is_popular: false,
    sort_order: 0,
    prices: buildMenuPrices(
      input.pricingBizType,
      formConfig,
      primary > 0 ? primary : input.formBasePrice,
      input.formPrices,
      input.formExtras,
    ),
  }
}

export function validateMenuPayload(payload: MenuCreatePayload): string | null {
  if (!payload.name.trim()) return '메뉴 이름을 입력해주세요.'
  if (payload.duration_minutes < 1) return '소요시간을 입력해주세요.'
  const maxPrice = Math.max(...payload.prices.map((p) => p.price), 0)
  if (maxPrice <= 0) return '가격을 입력해주세요.'
  return null
}
