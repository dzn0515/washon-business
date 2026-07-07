import {
  getBasePriceHint,
  getBasePriceLabel,
  getPriceSectionTitle,
  shouldShowVehiclePriceGrid,
} from '@/lib/pricing-label'

export type MenuFormFieldType = 'text' | 'number' | 'checkbox' | 'price'

export type MenuFormField = {
  key: string
  type: MenuFormFieldType
  label: string
  placeholder?: string
  helpText?: string
  /** 대표 가격(formBasePrice)에 매핑 */
  isPrimaryPrice?: boolean
}

export type MenuCategoryOption = {
  value: string
  label: string
  apiCategory: string
}

export type MenuFormConfig = {
  categories: MenuCategoryOption[]
  defaultCategory: string
  fields: MenuFormField[]
  showVehicleGrid: boolean
  showName: boolean
  showDuration: boolean
  priceSectionTitle?: string
  priceHint?: string
}

export type MenuFormExtras = Record<string, string | number | boolean>

const META_PREFIX = 'AUTOON_MENU_META:'

type BizFamily = 'wash' | 'tire' | 'tint' | 'bench' | 'dent'

function norm(bizType?: string | null): string {
  return (bizType ?? 'wash').trim().toLowerCase()
}

function getBizFamily(bizType?: string | null): BizFamily {
  const code = norm(bizType)
  if (shouldShowVehiclePriceGrid(code)) return 'wash'
  if (['tire', 'oil_maintenance', 'oil', 'maintenance', 'repair', 'battery'].includes(code)) {
    return 'tire'
  }
  if (['glass_tint', 'tinting', 'glass', 'ppf', 'wrap'].includes(code)) return 'tint'
  if (['blackbox_navi', 'blackbox', 'navigation', 'navi', 'audio'].includes(code)) return 'bench'
  if (['dent_repair', 'dent'].includes(code)) return 'dent'
  return 'wash'
}

const TIRE_CATEGORIES: MenuCategoryOption[] = [
  { value: 'all', label: '전상품', apiCategory: 'labor' },
  { value: 'tire_replace', label: '타이어 교체', apiCategory: 'tire_product' },
  { value: 'wheel_balance', label: '휠 밸런스', apiCategory: 'alignment' },
  { value: 'rotation', label: '위치교환', apiCategory: 'labor' },
  { value: 'engine_oil', label: '엔진오일', apiCategory: 'oil' },
]

const TINT_CATEGORIES: MenuCategoryOption[] = [
  { value: 'all', label: '전상품', apiCategory: 'tinting' },
  { value: 'front', label: '전면', apiCategory: 'construction' },
  { value: 'side_rear', label: '측후면', apiCategory: 'construction' },
  { value: 'full', label: '전체 시공', apiCategory: 'construction' },
]

const BENCH_CATEGORIES: MenuCategoryOption[] = [
  { value: 'all', label: '전상품', apiCategory: 'installation_labor' },
  { value: 'blackbox', label: '블랙박스', apiCategory: 'blackbox' },
  { value: 'navi', label: '내비게이션', apiCategory: 'navi' },
  { value: 'audio', label: '카오디오', apiCategory: 'audio' },
]

const DENT_CATEGORIES: MenuCategoryOption[] = [
  { value: 'all', label: '전상품', apiCategory: 'repair' },
  { value: 'door_ding', label: '문콕', apiCategory: 'dent' },
  { value: 'bumper', label: '범퍼', apiCategory: 'repair' },
  { value: 'scratch', label: '흠집 제거', apiCategory: 'repair' },
]

const WASH_CATEGORIES: MenuCategoryOption[] = [
  { value: 'wash', label: '세차', apiCategory: 'wash' },
  { value: 'premium', label: '프리미엄', apiCategory: 'premium' },
  { value: 'detailing', label: '디테일링', apiCategory: 'detailing' },
  { value: 'coating', label: '코팅', apiCategory: 'coating' },
  { value: 'interior', label: '실내크리닝', apiCategory: 'interior' },
]

function field(
  key: string,
  type: MenuFormFieldType,
  label: string,
  opts?: Partial<MenuFormField>,
): MenuFormField {
  return { key, type, label, ...opts }
}

function tireFields(category: string): MenuFormField[] {
  switch (category) {
    case 'tire_replace':
      return [
        field('tireInch', 'text', '타이어 인치', { placeholder: '예: 17, 18' }),
        field('brandMaker', 'text', '브랜드/메이커', { placeholder: '예: 한국타이어, 넥센' }),
        field('installFee', 'price', '장착비', { isPrimaryPrice: true, placeholder: '0' }),
        field('balanceIncluded', 'checkbox', '휠밸런스 포함'),
      ]
    case 'wheel_balance':
      return [
        field('tireInch', 'text', '인치', { placeholder: '예: 17' }),
        field('workFee', 'price', '기본 작업비', { isPrimaryPrice: true }),
      ]
    case 'rotation':
      return [field('workFee', 'price', '기본 작업비', { isPrimaryPrice: true })]
    case 'engine_oil':
      return [
        field('vehicleOilType', 'text', '차종/오일 종류', {
          placeholder: '예: 가솔린 5W-30, 디젤 5W-40',
        }),
        field('basePrice', 'price', '기본 가격', { isPrimaryPrice: true }),
      ]
    default:
      return [field('basePrice', 'price', '기본 가격', { isPrimaryPrice: true })]
  }
}

function tintFields(category: string): MenuFormField[] {
  if (category === 'all') {
    return [field('basePrice', 'price', '기본 가격', { isPrimaryPrice: true })]
  }
  return [
    field('filmGrade', 'text', '필름 등급', { placeholder: '예: 루마 버텍스, 3M 크리스탈' }),
    field(
      'installPrice',
      'price',
      category === 'full' ? '전체 가격' : '시공 가격',
      { isPrimaryPrice: true },
    ),
  ]
}

function benchFields(category: string): MenuFormField[] {
  switch (category) {
    case 'blackbox':
      return [
        field('productModel', 'text', '제품명/모델명', { placeholder: '예: 파인뷰 X500 2채널' }),
        field('installFee', 'price', '장착비', { isPrimaryPrice: true }),
        field('productIncluded', 'checkbox', '제품 포함'),
      ]
    case 'navi':
      return [
        field('productModel', 'text', '제품명/모델명', { placeholder: '예: 네비 모델명' }),
        field('installFee', 'price', '장착비', { isPrimaryPrice: true }),
      ]
    case 'audio':
      return [
        field('productWorkName', 'text', '제품/작업명', { placeholder: '예: 스피커 업그레이드' }),
        field('installFee', 'price', '설치비', { isPrimaryPrice: true }),
      ]
    default:
      return [field('basePrice', 'price', '기본 가격', { isPrimaryPrice: true })]
  }
}

function dentFields(category: string): MenuFormField[] {
  if (category === 'all') {
    return [field('estimateStart', 'price', '견적 시작가', { isPrimaryPrice: true })]
  }
  return [
    field('bodyPart', 'text', '부위', { placeholder: '예: 운전석 도어, 전면 범퍼' }),
    field('unitOrStartPrice', 'price', '개당 가격 또는 시작가', { isPrimaryPrice: true }),
  ]
}

export function getMenuCategoriesForBiz(bizType?: string | null): MenuCategoryOption[] {
  switch (getBizFamily(bizType)) {
    case 'tire':
      return TIRE_CATEGORIES
    case 'tint':
      return TINT_CATEGORIES
    case 'bench':
      return BENCH_CATEGORIES
    case 'dent':
      return DENT_CATEGORIES
    default:
      return WASH_CATEGORIES
  }
}

export function getDefaultFormCategory(bizType?: string | null): string {
  const family = getBizFamily(bizType)
  if (family === 'wash') return 'wash'
  return 'all'
}

export function toApiCategory(bizType: string | null | undefined, formCategory: string): string {
  const cats = getMenuCategoriesForBiz(bizType)
  return cats.find((c) => c.value === formCategory)?.apiCategory ?? formCategory
}

export function inferFormCategoryFromApi(
  bizType: string | null | undefined,
  apiCategory?: string | null,
): string {
  const cats = getMenuCategoriesForBiz(bizType)
  const code = (apiCategory ?? '').trim()
  if (!code) return getDefaultFormCategory(bizType)
  const exact = cats.find((c) => c.value === code)
  if (exact) return exact.value
  const byApi = cats.find((c) => c.apiCategory === code)
  if (byApi) return byApi.value
  return getDefaultFormCategory(bizType)
}

export function getMenuFormConfig(
  bizType?: string | null,
  category?: string | null,
): MenuFormConfig {
  const family = getBizFamily(bizType)
  const categories = getMenuCategoriesForBiz(bizType)
  const defaultCategory = getDefaultFormCategory(bizType)
  const selected = category && categories.some((c) => c.value === category) ? category : defaultCategory

  if (family === 'wash') {
    return {
      categories,
      defaultCategory,
      showVehicleGrid: true,
      showName: true,
      showDuration: true,
      fields: [],
      priceSectionTitle: getPriceSectionTitle(bizType),
      priceHint: getBasePriceHint(bizType),
    }
  }

  const base = {
    categories,
    defaultCategory,
    showVehicleGrid: false,
    showName: true,
    showDuration: true,
    priceHint: getBasePriceHint(bizType),
  }

  switch (family) {
    case 'tire':
      return {
        ...base,
        fields: tireFields(selected),
        priceSectionTitle: selected === 'engine_oil' ? '정비 기본 가격' : getPriceSectionTitle(bizType),
      }
    case 'tint':
      return { ...base, fields: tintFields(selected), priceSectionTitle: getPriceSectionTitle(bizType) }
    case 'bench':
      return { ...base, fields: benchFields(selected), priceSectionTitle: getPriceSectionTitle(bizType) }
    case 'dent':
      return { ...base, fields: dentFields(selected), priceSectionTitle: getPriceSectionTitle(bizType) }
    default:
      return {
        ...base,
        fields: [field('basePrice', 'price', getBasePriceLabel(bizType), { isPrimaryPrice: true })],
        priceSectionTitle: getPriceSectionTitle(bizType),
      }
  }
}

export function getSharedFieldKeys(a: MenuFormField[], b: MenuFormField[]): string[] {
  const bKeys = new Set(b.map((f) => f.key))
  return a.filter((f) => bKeys.has(f.key)).map((f) => f.key)
}

export function resolvePrimaryPrice(
  config: MenuFormConfig,
  formBasePrice: number,
  extras: MenuFormExtras,
): number {
  const primary = config.fields.find((f) => f.isPrimaryPrice)
  if (!primary) return formBasePrice
  const raw = extras[primary.key]
  if (typeof raw === 'number' && raw > 0) return raw
  if (primary.key === 'basePrice' || primary.key === 'estimateStart') return formBasePrice
  return formBasePrice
}

export function syncExtrasToBasePrice(
  config: MenuFormConfig,
  extras: MenuFormExtras,
  currentBase: number,
): number {
  const primary = config.fields.find((f) => f.isPrimaryPrice)
  if (!primary) return currentBase
  const raw = extras[primary.key]
  if (typeof raw === 'number') return raw
  return currentBase
}

export function stripMetaBlock(description?: string | null): string {
  if (!description) return ''
  const idx = description.lastIndexOf(META_PREFIX)
  if (idx === -1) return description.trim()
  return description.slice(0, idx).trim()
}

export function serializeMenuMeta(
  existingDescription: string | null | undefined,
  meta: MenuFormExtras,
): string {
  const humanText = stripMetaBlock(existingDescription)
  const clean = Object.fromEntries(
    Object.entries(meta).filter(([, v]) => v !== '' && v !== false && v !== undefined),
  )
  if (Object.keys(clean).length === 0) return humanText
  const metaBlock = `${META_PREFIX}${JSON.stringify(clean)}`
  if (!humanText) return metaBlock
  return `${humanText}\n${metaBlock}`
}

export function serializeMenuDescription(
  extras: MenuFormExtras,
  existingDescription?: string | null,
  humanLines?: string[],
): string {
  const humanFromExisting = stripMetaBlock(existingDescription)
  const humanText = humanLines?.length ? humanLines.join('\n') : humanFromExisting
  return serializeMenuMeta(humanText || null, extras)
}

export function parseMenuDescription(description?: string | null): MenuFormExtras {
  if (!description) return {}
  const idx = description.lastIndexOf(META_PREFIX)
  if (idx === -1) return {}
  try {
    return JSON.parse(description.slice(idx + META_PREFIX.length)) as MenuFormExtras
  } catch {
    return {}
  }
}
