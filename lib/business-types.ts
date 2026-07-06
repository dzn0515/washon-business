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
  wash: '예: 소형 실내외 세차',
  detailing: '예: 디테일링 풀코스',
  tire: '예: 타이어 교체, 휠 밸런스',
  oil_maintenance: '예: 엔진오일 교환, 에어컨 가스',
  battery: '예: 배터리 교체',
  glass_tint: '예: 전면 썬팅, 측후면 썬팅, 전체 썬팅',
  blackbox_navi: '예: 블랙박스 장착, 내비게이션 장착, 카오디오 설치',
  dent_repair: '예: 문콕 복원, 범퍼 복원, 흠집 제거',
}

export function getBusinessTypeLabel(code: string): string {
  return BUSINESS_TYPE_LABELS[code] ?? code
}

export function getMenuNamePlaceholder(code: string | null | undefined): string {
  return MENU_NAME_PLACEHOLDERS[code as BusinessTypeCode] ?? '예: 대표 작업 메뉴'
}
