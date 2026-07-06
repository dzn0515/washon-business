/** 업종별 메뉴/가격 UI 라벨 — 차종 그리드는 세차·디테일링 계열만 */

const VEHICLE_GRID_TYPES = new Set(['wash', 'detailing', 'polish', 'coating'])
const LIFT_TYPES = new Set(['tire', 'oil', 'oil_maintenance', 'repair', 'battery', 'maintenance'])
const ROOM_TYPES = new Set(['tinting', 'glass', 'glass_tint', 'ppf', 'wrap'])
const BENCH_TYPES = new Set(['audio', 'blackbox', 'blackbox_navi', 'navigation'])
const ZONE_TYPES = new Set(['dent', 'dent_repair'])

function norm(bizType?: string | null): string {
  return (bizType ?? 'wash').trim().toLowerCase()
}

export function shouldShowVehiclePriceGrid(bizType?: string | null): boolean {
  return VEHICLE_GRID_TYPES.has(norm(bizType))
}

export function getBasePriceLabel(bizType?: string | null): string {
  const code = norm(bizType)
  if (VEHICLE_GRID_TYPES.has(code)) return '소형 국산 기준가'
  if (LIFT_TYPES.has(code)) return '기본 가격 (타이어·장착)'
  if (ROOM_TYPES.has(code)) return '시공 가격 (부위·필름)'
  if (BENCH_TYPES.has(code)) return '제품·장착 가격'
  if (ZONE_TYPES.has(code)) return '작업 견적 (기본가)'
  return '가격'
}

export function getBasePriceHint(bizType?: string | null): string {
  const code = norm(bizType)
  if (VEHICLE_GRID_TYPES.has(code)) return '입력 시 차종별 가격이 자동 계산됩니다'
  if (LIFT_TYPES.has(code)) return '타이어 규격·장착/교체 공임 기준 가격입니다'
  if (ROOM_TYPES.has(code)) return '부위·필름 종류별 시공 가격입니다'
  if (BENCH_TYPES.has(code)) return '제품 구성과 장착 공임이 포함된 가격입니다'
  if (ZONE_TYPES.has(code)) return '작업 부위·손상 범위에 따른 견적 기준가입니다'
  return '고객앱에 표시될 메뉴 가격입니다'
}

export function getPriceSectionTitle(bizType?: string | null): string {
  const code = norm(bizType)
  if (VEHICLE_GRID_TYPES.has(code)) return '차종별 가격'
  if (LIFT_TYPES.has(code)) return '타이어·장착 가격'
  if (ROOM_TYPES.has(code)) return '부위·필름별 가격'
  if (BENCH_TYPES.has(code)) return '제품·장착 가격'
  if (ZONE_TYPES.has(code)) return '작업 부위별 견적'
  return '가격'
}

export function getListPriceSummaryLabel(bizType?: string | null): string {
  const code = norm(bizType)
  if (VEHICLE_GRID_TYPES.has(code)) return '차종별'
  if (LIFT_TYPES.has(code)) return '타이어·장착'
  if (ROOM_TYPES.has(code)) return '부위·필름'
  if (BENCH_TYPES.has(code)) return '제품·장착'
  if (ZONE_TYPES.has(code)) return '작업 견적'
  return '가격'
}
