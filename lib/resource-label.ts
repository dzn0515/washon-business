/** 업종(biz_type)별 작업 자원 표시명 — API/DB의 bay_* 필드명과 분리 */

const BAY_TYPES = new Set(['wash', 'detailing', 'polish', 'coating'])
const LIFT_TYPES = new Set(['tire', 'oil', 'oil_maintenance', 'repair', 'battery', 'maintenance'])
const ROOM_TYPES = new Set(['tinting', 'glass', 'glass_tint', 'ppf', 'wrap'])
const BENCH_TYPES = new Set(['audio', 'blackbox', 'blackbox_navi', 'navigation'])
const ZONE_TYPES = new Set(['dent', 'dent_repair'])

export const DEFAULT_RESOURCE_LABEL = '작업공간'

export function getResourceLabel(bizType?: string | null): string {
  const code = (bizType ?? 'wash').trim().toLowerCase()
  if (BAY_TYPES.has(code)) return '베이'
  if (LIFT_TYPES.has(code)) return '리프트'
  if (ROOM_TYPES.has(code)) return '작업실'
  if (BENCH_TYPES.has(code)) return '작업대'
  if (ZONE_TYPES.has(code)) return '작업존'
  return DEFAULT_RESOURCE_LABEL
}

export function formatResourceName(bizType: string | null | undefined, number: number): string {
  return `${getResourceLabel(bizType)} ${number}`
}

/** API resource_label이 있으면 우선 사용 */
export function resolveResourceLabel(
  bizType?: string | null,
  apiLabel?: string | null,
): string {
  const trimmed = apiLabel?.trim()
  if (trimmed) return trimmed
  return getResourceLabel(bizType)
}

export function formatResourceCountLabel(
  bizType?: string | null,
  apiLabel?: string | null,
): string {
  return `${resolveResourceLabel(bizType, apiLabel)} 수`
}

export function formatResourceCountOption(
  n: number,
  bizType?: string | null,
  apiLabel?: string | null,
): string {
  return `${n}${resolveResourceLabel(bizType, apiLabel)}`
}

export function formatResourceManageTitle(
  bizType?: string | null,
  apiLabel?: string | null,
): string {
  return `${resolveResourceLabel(bizType, apiLabel)} 관리`
}
