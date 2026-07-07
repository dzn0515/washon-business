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

export type BizFamily = 'wash' | 'tire' | 'tint' | 'bench' | 'dent'

function norm(bizType?: string | null): string {
  return (bizType ?? 'wash').trim().toLowerCase()
}

export function getBizFamily(bizType?: string | null): BizFamily {
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

const WASH_CATEGORIES: MenuCategoryOption[] = [
  { value: 'hand_wash', label: '손세차', apiCategory: 'wash' },
  { value: 'detailing', label: '디테일링', apiCategory: 'detailing' },
  { value: 'polish', label: '광택', apiCategory: 'premium' },
  { value: 'glass_coating', label: '유리막', apiCategory: 'coating' },
  { value: 'interior', label: '실내크리닝', apiCategory: 'interior' },
  { value: 'hydro_coating', label: '발수코팅', apiCategory: 'coating' },
  { value: 'etc', label: '기타', apiCategory: 'wash' },
]

const TIRE_CATEGORIES: MenuCategoryOption[] = [
  { value: 'tire_replace', label: '타이어 교체', apiCategory: 'tire_product' },
  { value: 'wheel_balance', label: '휠 밸런스', apiCategory: 'alignment' },
  { value: 'rotation', label: '위치교환', apiCategory: 'labor' },
  { value: 'puncture', label: '펑크수리', apiCategory: 'labor' },
  { value: 'engine_oil', label: '엔진오일', apiCategory: 'oil' },
  { value: 'brake', label: '브레이크', apiCategory: 'labor' },
  { value: 'etc', label: '기타', apiCategory: 'labor' },
]

const TINT_CATEGORIES: MenuCategoryOption[] = [
  { value: 'front', label: '전면', apiCategory: 'construction' },
  { value: 'side_rear', label: '측후면', apiCategory: 'construction' },
  { value: 'full', label: '전체', apiCategory: 'construction' },
  { value: 'ppf', label: 'PPF', apiCategory: 'construction' },
  { value: 'glass_coating', label: '유리막', apiCategory: 'tinting' },
  { value: 'etc', label: '기타', apiCategory: 'tinting' },
]

const BENCH_CATEGORIES: MenuCategoryOption[] = [
  { value: 'blackbox', label: '블랙박스', apiCategory: 'blackbox' },
  { value: 'navi', label: '내비게이션', apiCategory: 'navi' },
  { value: 'audio', label: '카오디오', apiCategory: 'audio' },
  { value: 'rear_camera', label: '후방카메라', apiCategory: 'installation_labor' },
  { value: 'etc', label: '기타', apiCategory: 'installation_labor' },
]

const DENT_CATEGORIES: MenuCategoryOption[] = [
  { value: 'door_ding', label: '문콕', apiCategory: 'dent' },
  { value: 'bumper', label: '범퍼', apiCategory: 'repair' },
  { value: 'scratch', label: '흠집', apiCategory: 'repair' },
  { value: 'panel', label: '판금', apiCategory: 'repair' },
  { value: 'paint', label: '도색', apiCategory: 'repair' },
  { value: 'etc', label: '기타', apiCategory: 'repair' },
]

const LEGACY_FORM_CATEGORY: Record<string, string> = {
  all: '',
  wash: 'hand_wash',
  premium: 'polish',
  coating: 'glass_coating',
  tire_product: 'tire_replace',
  alignment: 'wheel_balance',
  labor: 'rotation',
  oil: 'engine_oil',
  construction: 'front',
  tinting: 'etc',
  installation_labor: 'etc',
  blackbox: 'blackbox',
  navi: 'navi',
  audio: 'audio',
  dent: 'door_ding',
  repair: 'bumper',
}

function field(
  key: string,
  type: MenuFormFieldType,
  label: string,
  opts?: Partial<MenuFormField>,
): MenuFormField {
  return { key, type, label, ...opts }
}

function etcPriceFields(label = '가격'): MenuFormField[] {
  return [field('salePrice', 'price', label, { isPrimaryPrice: true, placeholder: '0' })]
}

function tireFields(category: string): MenuFormField[] {
  switch (category) {
    case 'tire_replace':
      return [
        field('tireWidth', 'text', '폭', { placeholder: '예: 235' }),
        field('aspectRatio', 'text', '편평비', { placeholder: '예: 55' }),
        field('tireInch', 'text', '인치', { placeholder: '예: 18' }),
        field('brandMaker', 'text', '브랜드', { placeholder: '예: 미쉐린' }),
        field('productName', 'text', '상품명', { placeholder: '예: 프라이머시4' }),
        field('installFee', 'price', '장착비', { placeholder: '0' }),
        field('salePrice', 'price', '판매가격', { isPrimaryPrice: true, placeholder: '0' }),
        field('balanceIncluded', 'checkbox', '휠밸런스 포함'),
      ]
    case 'wheel_balance':
      return [
        field('tireInch', 'text', '인치', { placeholder: '예: 18' }),
        field('salePrice', 'price', '기본 작업비', { isPrimaryPrice: true }),
      ]
    case 'rotation':
    case 'puncture':
      return [field('salePrice', 'price', '기본 작업비', { isPrimaryPrice: true })]
    case 'engine_oil':
      return [
        field('oilType', 'text', '오일 종류', { placeholder: '예: 합성유 5W-30' }),
        field('vehicleType', 'text', '차종', { placeholder: '예: SUV, 승용' }),
        field('salePrice', 'price', '가격', { isPrimaryPrice: true }),
      ]
    case 'brake':
      return [
        field('brakeType', 'text', '작업 종류', { placeholder: '예: 패드 교환' }),
        field('salePrice', 'price', '가격', { isPrimaryPrice: true }),
      ]
    default:
      return etcPriceFields()
  }
}

function tintFields(category: string): MenuFormField[] {
  switch (category) {
    case 'front':
    case 'side_rear':
    case 'full':
    case 'ppf':
      return [
        field('filmBrand', 'text', '필름 브랜드', { placeholder: '예: 레이노' }),
        field('filmGrade', 'text', '필름 등급', { placeholder: '예: S9' }),
        field('warrantyPeriod', 'text', '보증기간', { placeholder: '예: 5년' }),
        field('salePrice', 'price', '가격', { isPrimaryPrice: true }),
      ]
    case 'glass_coating':
      return [
        field('coatingName', 'text', '유리막 제품명', { placeholder: '예: 세라믹 프로' }),
        field('salePrice', 'price', '가격', { isPrimaryPrice: true }),
      ]
    default:
      return etcPriceFields()
  }
}

function benchFields(category: string): MenuFormField[] {
  switch (category) {
    case 'blackbox':
      return [
        field('brandMaker', 'text', '브랜드', { placeholder: '예: 아이나비' }),
        field('productModel', 'text', '모델명', { placeholder: '예: QXD1' }),
        field('mobileInstall', 'checkbox', '출장장착'),
        field('salePrice', 'price', '가격', { isPrimaryPrice: true }),
        field('productIncluded', 'checkbox', '제품 포함'),
      ]
    case 'navi':
      return [
        field('brandMaker', 'text', '브랜드', { placeholder: '예: 파인뷰' }),
        field('productModel', 'text', '모델명', { placeholder: '예: LX500' }),
        field('mobileInstall', 'checkbox', '출장장착'),
        field('salePrice', 'price', '가격', { isPrimaryPrice: true }),
      ]
    case 'audio':
      return [
        field('productWorkName', 'text', '제품/작업명', { placeholder: '예: 스피커 업그레이드' }),
        field('salePrice', 'price', '가격', { isPrimaryPrice: true }),
      ]
    case 'rear_camera':
      return [
        field('brandMaker', 'text', '브랜드', { placeholder: '예: 아이나비' }),
        field('productModel', 'text', '모델명', { placeholder: '예: 후방카메라' }),
        field('salePrice', 'price', '가격', { isPrimaryPrice: true }),
      ]
    default:
      return etcPriceFields()
  }
}

function dentFields(category: string): MenuFormField[] {
  switch (category) {
    case 'door_ding':
    case 'bumper':
    case 'scratch':
      return [
        field('bodyPart', 'text', '부위', { placeholder: '예: 운전석 앞문' }),
        field('estimateStart', 'price', '견적 시작가', { isPrimaryPrice: true }),
      ]
    case 'panel':
    case 'paint':
      return [
        field('bodyPart', 'text', '부위', { placeholder: '예: 전면 범퍼' }),
        field('estimateStart', 'price', '견적 시작가', { isPrimaryPrice: true }),
      ]
    default:
      return etcPriceFields('견적 시작가')
  }
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
  switch (family) {
    case 'tire':
      return 'tire_replace'
    case 'tint':
      return 'front'
    case 'bench':
      return 'blackbox'
    case 'dent':
      return 'door_ding'
    default:
      return 'hand_wash'
  }
}

export function getCategoryLabel(bizType: string | null | undefined, formCategory: string): string {
  const cats = getMenuCategoriesForBiz(bizType)
  return cats.find((c) => c.value === formCategory)?.label ?? formCategory
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

  const legacy = LEGACY_FORM_CATEGORY[code]
  if (legacy && cats.some((c) => c.value === legacy)) return legacy

  const exact = cats.find((c) => c.value === code)
  if (exact) return exact.value

  const byApi = cats.find((c) => c.apiCategory === code)
  if (byApi) return byApi.value

  if (code === 'all') return getDefaultFormCategory(bizType)

  return getDefaultFormCategory(bizType)
}

function shouldShowMenuName(family: BizFamily, category: string): boolean {
  if (family === 'wash') return true
  return category === 'etc'
}

export function getMenuFormConfig(
  bizType?: string | null,
  category?: string | null,
): MenuFormConfig {
  const family = getBizFamily(bizType)
  const categories = getMenuCategoriesForBiz(bizType)
  const defaultCategory = getDefaultFormCategory(bizType)
  const selected =
    category && categories.some((c) => c.value === category) ? category : defaultCategory

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
    showName: shouldShowMenuName(family, selected),
    showDuration: true,
    priceHint: getBasePriceHint(bizType),
  }

  switch (family) {
    case 'tire':
      return {
        ...base,
        fields: tireFields(selected),
        priceSectionTitle: getPriceSectionTitle(bizType),
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
        fields: [field('salePrice', 'price', getBasePriceLabel(bizType), { isPrimaryPrice: true })],
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
  if (primary) {
    const raw = extras[primary.key]
    if (typeof raw === 'number' && raw > 0) return raw
  }
  for (const key of ['salePrice', 'installFee', 'installPrice', 'workFee', 'basePrice', 'estimateStart']) {
    const raw = extras[key]
    if (typeof raw === 'number' && raw > 0) return raw
  }
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

export function resolveMenuName(
  formName: string,
  formExtras: MenuFormExtras,
  bizType: string,
): string {
  const trimmed = formName.trim()
  if (shouldShowVehiclePriceGrid(bizType)) return trimmed

  const product =
    formExtras.productName ??
    formExtras.productModel ??
    formExtras.productWorkName ??
    formExtras.filmGrade ??
    formExtras.coatingName

  if (typeof product === 'string' && product.trim()) return product.trim()
  if (trimmed) return trimmed
  return '메뉴'
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
