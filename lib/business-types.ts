export const BUSINESS_TYPES = [
  { code: 'wash', label: '세차' },
  { code: 'tire', label: '타이어' },
  { code: 'detailing', label: '디테일링' },
  { code: 'battery', label: '배터리' },
  { code: 'glass_tint', label: '유리·선팅' },
  { code: 'blackbox_navi', label: '블박·네비' },
  { code: 'dent_repair', label: '덴트·복원' },
  { code: 'oil_maintenance', label: '오일·정비' },
] as const

export type BusinessTypeCode = (typeof BUSINESS_TYPES)[number]['code']

export const BUSINESS_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  BUSINESS_TYPES.map((item) => [item.code, item.label]),
)

export const MENU_NAME_PLACEHOLDERS: Partial<Record<BusinessTypeCode, string>> = {
  tire: '예: 한국 K127 225/45R17',
  blackbox_navi: '예: 파인뷰 X500 2채널 (기기+장착)',
  glass_tint: '예: 루마 버텍스 전면',
}

export function getBusinessTypeLabel(code: string): string {
  return BUSINESS_TYPE_LABELS[code] ?? code
}

export function getMenuNamePlaceholder(code: string | null | undefined): string {
  return MENU_NAME_PLACEHOLDERS[code as BusinessTypeCode] ?? '예: 대표 작업 메뉴'
}
