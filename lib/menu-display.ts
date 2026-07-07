import {
  getMenuCategoriesForBiz,
  inferFormCategoryFromApi,
  parseMenuDescription,
  stripMetaBlock,
  serializeMenuMeta,
  type MenuFormExtras,
} from '@/lib/menu-form-config'
import { shouldShowVehiclePriceGrid } from '@/lib/pricing-label'
import { won } from '@/lib/dashboard-ui'

export type MenuDisplaySource = {
  name: string
  description?: string | null
  category?: string | null
  price?: number
}

const INTERNAL_META_KEYS = new Set(['_formCategory'])

export function parseMenuMeta(description?: string | null): MenuFormExtras {
  return parseMenuDescription(description)
}

export { stripMetaBlock, serializeMenuMeta }

function publicExtras(meta: MenuFormExtras): MenuFormExtras {
  return Object.fromEntries(
    Object.entries(meta).filter(([k]) => !INTERNAL_META_KEYS.has(k)),
  )
}

function categoryLabel(bizType: string, formCategory: string): string {
  const cats = getMenuCategoriesForBiz(bizType)
  return cats.find((c) => c.value === formCategory)?.label ?? formCategory
}

function resolveFormCategory(
  bizType: string,
  menu: MenuDisplaySource,
  meta: MenuFormExtras,
): string {
  if (typeof meta._formCategory === 'string' && meta._formCategory) {
    return meta._formCategory
  }
  return inferFormCategoryFromApi(bizType, menu.category)
}

function joinParts(parts: Array<string | number | boolean | undefined | null>): string {
  return parts
    .map((p) => (typeof p === 'string' ? p.trim() : p))
    .filter((p) => p !== '' && p !== false && p !== undefined && p !== null)
    .join(' ')
}

function tintCategoryLabel(formCategory: string, fallback: string): string {
  switch (formCategory) {
    case 'front':
      return '전면 썬팅'
    case 'side_rear':
      return '측후면 썬팅'
    case 'full':
      return '전체 썬팅'
    default:
      return fallback
  }
}

export function buildMenuDisplayTitle(menu: MenuDisplaySource, bizType: string): string {
  if (shouldShowVehiclePriceGrid(bizType)) return menu.name

  const meta = parseMenuMeta(menu.description)
  const extras = publicExtras(meta)
  const formCategory = resolveFormCategory(bizType, menu, meta)
  const catLabel = categoryLabel(bizType, formCategory)

  if (['tire', 'oil_maintenance', 'oil', 'maintenance', 'repair', 'battery'].includes(bizType)) {
    switch (formCategory) {
      case 'tire_replace': {
        const inch = extras.tireInch ? `${extras.tireInch}인치` : ''
        const detail = joinParts([extras.brandMaker, menu.name, inch])
        return `[${catLabel}] ${detail || menu.name}`
      }
      case 'wheel_balance': {
        const inch = extras.tireInch ? `${extras.tireInch}인치` : ''
        return `[${catLabel}] ${joinParts([inch, '기본 작업']) || '기본 작업'}`
      }
      case 'rotation':
        return `[${catLabel}] 기본 작업`
      case 'engine_oil':
        return `[${catLabel}] ${extras.vehicleOilType || menu.name}`
      default:
        return menu.name
    }
  }

  if (['glass_tint', 'tinting', 'glass', 'ppf', 'wrap'].includes(bizType)) {
    if (formCategory === 'all') return menu.name
    const label = tintCategoryLabel(formCategory, catLabel)
    return `[${label}] ${extras.filmGrade || menu.name}`
  }

  if (['blackbox_navi', 'blackbox', 'navigation', 'navi', 'audio'].includes(bizType)) {
    switch (formCategory) {
      case 'blackbox':
        return `[블랙박스] ${extras.productModel || menu.name}`
      case 'navi':
        return `[내비게이션] ${extras.productModel || menu.name}`
      case 'audio':
        return `[카오디오] ${extras.productWorkName || menu.name}`
      default:
        return menu.name
    }
  }

  if (['dent_repair', 'dent'].includes(bizType)) {
    switch (formCategory) {
      case 'door_ding':
        return `[문콕] ${extras.bodyPart || menu.name}`
      case 'bumper':
        return `[범퍼] ${extras.bodyPart || menu.name}`
      case 'scratch':
        return `[흠집 제거] ${extras.bodyPart || menu.name}`
      default:
        return menu.name
    }
  }

  return menu.name
}

export function buildMenuDisplaySubtitle(menu: MenuDisplaySource, bizType: string): string | null {
  if (shouldShowVehiclePriceGrid(bizType)) return null

  const meta = parseMenuMeta(menu.description)
  const extras = publicExtras(meta)
  const formCategory = resolveFormCategory(bizType, menu, meta)

  if (formCategory === 'blackbox' && ['blackbox_navi', 'blackbox'].includes(bizType)) {
    const parts: string[] = []
    if (extras.productIncluded === true) parts.push('제품 포함')
    else if (extras.productIncluded === false) parts.push('제품 미포함')
    if (typeof extras.installFee === 'number' && extras.installFee > 0) {
      parts.push(`장착비 ${won(extras.installFee)}`)
    }
    if (extras.balanceIncluded === true) parts.push('휠밸런스 포함')
    return parts.length > 0 ? parts.join(' · ') : null
  }

  if (formCategory === 'tire_replace' && extras.balanceIncluded === true) {
    return '휠밸런스 포함'
  }

  const human = stripMetaBlock(menu.description)
  if (human) return human

  if (menu.name && buildMenuDisplayTitle(menu, bizType) !== menu.name) {
    return menu.name
  }

  return null
}

export function stripInternalMetaKeys(extras: MenuFormExtras): MenuFormExtras {
  return publicExtras(extras)
}
