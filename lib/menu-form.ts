import { calcPriceGrid, type PriceGrid } from '@/lib/dashboard-ui'
import { shouldShowVehiclePriceGrid } from '@/lib/pricing-label'

/** 비세차 업종: API vehicle_size 슬롯에 동일 단일가 매핑 */
export function flatPriceGrid(price: number): PriceGrid {
  const p = Math.max(0, Math.round(price))
  return {
    domestic_small: p,
    domestic_medium: p,
    domestic_large: p,
    import_small: p,
    import_medium: p,
    import_large: p,
  }
}

export function applyMenuBasePrice(base: number, bizType?: string | null): PriceGrid {
  if (shouldShowVehiclePriceGrid(bizType)) return calcPriceGrid(base)
  return flatPriceGrid(base)
}

/** 폼·목록에 표시할 대표 가격 (비세차는 min, 세차는 소형 국산) */
export function getRepresentativeMenuPrice(grid: PriceGrid, bizType?: string | null): number {
  if (shouldShowVehiclePriceGrid(bizType)) return grid.domestic_small
  const values = Object.values(grid).filter((v) => v > 0)
  return values.length > 0 ? Math.min(...values) : 0
}

export function gridToApiPrices(
  grid: PriceGrid,
): { vehicle_size: string; vehicle_origin: string; price: number }[] {
  const sizes = ['small', 'medium', 'large'] as const
  return [
    ...sizes.map((size) => ({
      vehicle_size: size,
      vehicle_origin: 'domestic',
      price: grid[`domestic_${size}` as keyof PriceGrid],
    })),
    ...sizes.map((size) => ({
      vehicle_size: size,
      vehicle_origin: 'imported',
      price: grid[`import_${size}` as keyof PriceGrid],
    })),
  ]
}

const DEFAULT_CATEGORY_BY_BIZ: Record<string, string> = {
  wash: 'wash',
  detailing: 'detailing',
  polish: 'detailing',
  coating: 'coating',
  tire: 'tire',
  oil: 'oil',
  oil_maintenance: 'maintenance',
  maintenance: 'maintenance',
  repair: 'maintenance',
  battery: 'battery',
  glass_tint: 'tinting',
  tinting: 'tinting',
  glass: 'glass',
  ppf: 'tinting',
  wrap: 'tinting',
  blackbox_navi: 'audio',
  blackbox: 'blackbox',
  navigation: 'navi',
  audio: 'audio',
  dent_repair: 'dent',
  dent: 'dent',
}

export function getDefaultMenuCategory(bizType?: string | null): string {
  const code = (bizType ?? 'wash').trim().toLowerCase()
  return DEFAULT_CATEGORY_BY_BIZ[code] ?? 'wash'
}
