import {
  getCategoryLabel,
  getBizFamily,
  inferFormCategoryFromApi,
  parseMenuDescription,
  stripMetaBlock,
  serializeMenuMeta,
  type MenuFormExtras,
} from '@/lib/menu-form-config'
import { shouldShowVehiclePriceGrid } from '@/lib/pricing-label'
import { won, type PriceGrid } from '@/lib/dashboard-ui'

export type MenuDisplaySource = {
  name: string
  description?: string | null
  category?: string | null
  price?: number
  duration_minutes?: number
  price_grid?: PriceGrid
}

export type MenuCardDisplay = {
  categoryBadge: string
  titleLines: string[]
  detailLines: string[]
  durationLabel: string
  priceLabel: string
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

function joinText(parts: Array<string | number | boolean | undefined | null>): string {
  return parts
    .map((p) => (typeof p === 'string' ? p.trim() : p))
    .filter((p) => p !== '' && p !== false && p !== undefined && p !== null)
    .join(' ')
}

function buildTireSize(extras: MenuFormExtras): string | null {
  const w = extras.tireWidth
  const ar = extras.aspectRatio
  const inch = extras.tireInch
  if (w && ar && inch) return `${w}/${ar}R${inch}`
  if (inch) return `${inch}인치`
  return null
}

function minGridPrice(grid?: PriceGrid): number | null {
  if (!grid) return null
  const values = Object.values(grid).filter((v) => typeof v === 'number' && v > 0)
  if (values.length === 0) return null
  return Math.min(...values)
}

export function buildMenuCardDisplay(
  menu: MenuDisplaySource,
  bizType: string,
): MenuCardDisplay {
  const meta = parseMenuMeta(menu.description)
  const extras = publicExtras(meta)
  const formCategory = resolveFormCategory(bizType, menu, meta)
  const categoryBadge = getCategoryLabel(bizType, formCategory)
  const duration = menu.duration_minutes ?? 0
  const family = getBizFamily(bizType)

  if (shouldShowVehiclePriceGrid(bizType)) {
    const minPrice = minGridPrice(menu.price_grid) ?? menu.price ?? 0
    return {
      categoryBadge,
      titleLines: [menu.name],
      detailLines: [],
      durationLabel: duration > 0 ? `⏱ ${duration}분` : '',
      priceLabel: minPrice > 0 ? `💰 경차 ${won(minPrice)}~` : '',
    }
  }

  const price = menu.price ?? 0
  const base: MenuCardDisplay = {
    categoryBadge,
    titleLines: [],
    detailLines: [],
    durationLabel: duration > 0 ? `⏱ ${duration}분` : '⏱ 견적',
    priceLabel: price > 0 ? `💰 ${won(price)}` : '',
  }

  if (family === 'tire') {
    switch (formCategory) {
      case 'tire_replace': {
        const size = buildTireSize(extras)
        const product = joinText([extras.brandMaker, extras.productName || menu.name])
        base.titleLines = [size, product].filter((x): x is string => Boolean(x))
        if (extras.balanceIncluded === true) base.detailLines.push('휠밸런스 포함')
        break
      }
      case 'wheel_balance': {
        const inch = extras.tireInch ? `${extras.tireInch}인치` : null
        base.titleLines = [inch ? `${inch} 기본 작업` : '기본 작업']
        break
      }
      case 'rotation':
      case 'puncture':
        base.titleLines = ['기본 작업']
        break
      case 'engine_oil':
        base.titleLines = [joinText([extras.oilType, extras.vehicleType]) || menu.name]
        break
      case 'brake':
        base.titleLines = [String(extras.brakeType || menu.name)]
        break
      default:
        base.titleLines = [menu.name]
    }
    return base
  }

  if (family === 'tint') {
    const film = joinText([extras.filmBrand, extras.filmGrade]) || String(extras.coatingName || menu.name)
    base.titleLines = [film]
    if (extras.warrantyPeriod) base.detailLines.push(`보증 ${extras.warrantyPeriod}`)
    return base
  }

  if (family === 'bench') {
    const title =
      formCategory === 'audio'
        ? String(extras.productWorkName || menu.name)
        : joinText([extras.brandMaker, extras.productModel || menu.name])
    base.titleLines = [title || menu.name]
    const details: string[] = []
    if (extras.mobileInstall === true) details.push('출장장착')
    if (extras.productIncluded === true) details.push('제품 포함')
    else if (extras.productIncluded === false) details.push('제품 미포함')
    base.detailLines = details
    return base
  }

  if (family === 'dent') {
    base.titleLines = [String(extras.bodyPart || menu.name)]
    if (['door_ding', 'bumper', 'scratch', 'panel', 'paint'].includes(formCategory)) {
      base.durationLabel = duration > 0 ? `⏱ ${duration}분` : '⏱ 견적'
      base.priceLabel = price > 0 ? `💰 ${won(price)}~` : base.priceLabel
    }
    return base
  }

  base.titleLines = [menu.name]
  return base
}

/** @deprecated use buildMenuCardDisplay */
export function buildMenuDisplayTitle(menu: MenuDisplaySource, bizType: string): string {
  const card = buildMenuCardDisplay(menu, bizType)
  return card.titleLines.join(' · ') || menu.name
}

/** @deprecated use buildMenuCardDisplay */
export function buildMenuDisplaySubtitle(menu: MenuDisplaySource, bizType: string): string | null {
  const card = buildMenuCardDisplay(menu, bizType)
  if (card.detailLines.length > 0) return card.detailLines.join(' · ')
  const human = stripMetaBlock(menu.description)
  return human || null
}

export function stripInternalMetaKeys(extras: MenuFormExtras): MenuFormExtras {
  return publicExtras(extras)
}
