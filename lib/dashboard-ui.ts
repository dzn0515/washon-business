export const CARD = 'bg-white border border-gray-100 rounded-xl p-4'
export const SECTION_LABEL = 'text-[12px] text-gray-400 font-medium mb-2'
export const BTN_PRIMARY = 'rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700'
export const ACTIVE_MENU = 'bg-blue-50 text-blue-600 font-medium'
export const INACTIVE_MENU = 'text-gray-500 hover:bg-gray-50'

export function won(amount: number) {
  return amount.toLocaleString() + '원'
}

export const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
] as const

export type PriceGrid = {
  domestic_small: number
  domestic_medium: number
  domestic_large: number
  import_small: number
  import_medium: number
  import_large: number
}

export function calcPriceGrid(base: number): PriceGrid {
  return {
    domestic_small: base,
    domestic_medium: Math.round(base * 1.2),
    domestic_large: Math.round(base * 1.4),
    import_small: Math.round(base * 1.25),
    import_medium: Math.round(base * 1.45),
    import_large: Math.round(base * 1.65),
  }
}
