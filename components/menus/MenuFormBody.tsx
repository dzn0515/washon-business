'use client'

import type { MenuFormExtras, MenuFormField } from '@/lib/menu-form-config'
import type { PriceGrid } from '@/lib/dashboard-ui'
import { getBasePriceLabel } from '@/lib/pricing-label'

const PRICE_GRID_LABELS: { key: keyof PriceGrid; label: string }[] = [
  { key: 'domestic_small', label: '소형 국산' },
  { key: 'domestic_medium', label: '중형 국산' },
  { key: 'domestic_large', label: '대형 국산' },
  { key: 'import_small', label: '소형 수입' },
  { key: 'import_medium', label: '중형 수입' },
  { key: 'import_large', label: '대형 수입' },
]

type Props = {
  bizType: string
  showVehicleGrid: boolean
  showName: boolean
  showDuration: boolean
  namePlaceholder: string
  priceSectionTitle?: string
  priceHint?: string
  fields: MenuFormField[]
  formName: string
  formDuration: number
  formBasePrice: number
  formPrices: PriceGrid
  extras: MenuFormExtras
  onNameChange: (v: string) => void
  onDurationChange: (v: number) => void
  onBasePriceChange: (v: number) => void
  onPricesChange: (grid: PriceGrid) => void
  onExtraChange: (key: string, value: string | number | boolean) => void
}

function renderExtraField(
  f: MenuFormField,
  extras: MenuFormExtras,
  onExtraChange: Props['onExtraChange'],
  onBasePriceChange: Props['onBasePriceChange'],
  formBasePrice: number,
) {
  if (f.type === 'checkbox') {
    return (
      <label key={f.key} className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(extras[f.key])}
          onChange={(e) => onExtraChange(f.key, e.target.checked)}
          className="rounded"
        />
        {f.label}
      </label>
    )
  }

  if (f.type === 'price' || f.type === 'number') {
    const value = f.isPrimaryPrice
      ? typeof extras[f.key] === 'number'
        ? (extras[f.key] as number)
        : formBasePrice
      : typeof extras[f.key] === 'number'
        ? (extras[f.key] as number)
        : ''

    return (
      <div key={f.key}>
        <label className="text-[12px] text-gray-400 font-medium mb-2 block">{f.label}</label>
        <input
          type="number"
          value={value}
          placeholder={f.placeholder}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (f.isPrimaryPrice) {
              onBasePriceChange(n)
            }
            onExtraChange(f.key, n)
          }}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
        />
        {f.helpText ? <p className="text-[11px] text-gray-400 mt-1">{f.helpText}</p> : null}
      </div>
    )
  }

  return (
    <div key={f.key}>
      <label className="text-[12px] text-gray-400 font-medium mb-2 block">{f.label}</label>
      <input
        type="text"
        value={typeof extras[f.key] === 'string' ? (extras[f.key] as string) : ''}
        placeholder={f.placeholder}
        onChange={(e) => onExtraChange(f.key, e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
      />
      {f.helpText ? <p className="text-[11px] text-gray-400 mt-1">{f.helpText}</p> : null}
    </div>
  )
}

export default function MenuFormBody({
  bizType,
  showVehicleGrid,
  showName,
  showDuration,
  namePlaceholder,
  priceSectionTitle,
  priceHint,
  fields,
  formName,
  formDuration,
  formBasePrice,
  formPrices,
  extras,
  onNameChange,
  onDurationChange,
  onBasePriceChange,
  onPricesChange,
  onExtraChange,
}: Props) {
  return (
    <div className="space-y-4">
      {showName ? (
        <div>
          <label className="text-[12px] text-gray-400 font-medium mb-2 block">메뉴 이름</label>
          <input
            value={formName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder={namePlaceholder}
          />
        </div>
      ) : null}

      {showDuration ? (
        <div>
          <label className="text-[12px] text-gray-400 font-medium mb-2 block">소요시간 (분)</label>
          <input
            type="number"
            value={formDuration}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
        </div>
      ) : null}

      {showVehicleGrid ? (
        <>
          <div>
            <label className="text-[12px] text-gray-400 font-medium mb-2 block">
              {getBasePriceLabel(bizType)}
            </label>
            <input
              type="number"
              value={formBasePrice}
              onChange={(e) => onBasePriceChange(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            {priceHint ? <p className="text-[11px] text-gray-400 mt-1">{priceHint}</p> : null}
          </div>
          <div>
            <label className="text-[12px] text-gray-400 font-medium mb-2 block">
              {priceSectionTitle ?? '차종별 가격'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRICE_GRID_LABELS.map(({ key, label }) => (
                <div key={key} className="bg-gray-50 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400">{label}</p>
                  <input
                    type="number"
                    value={formPrices[key]}
                    onChange={(e) =>
                      onPricesChange({ ...formPrices, [key]: Number(e.target.value) })
                    }
                    className="w-full mt-1 text-xs border border-gray-200 rounded px-1.5 py-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : fields.length > 0 ? (
        fields.map((f) =>
          renderExtraField(f, extras, onExtraChange, onBasePriceChange, formBasePrice),
        )
      ) : (
        <div>
          <label className="text-[12px] text-gray-400 font-medium mb-2 block">
            {priceSectionTitle ?? '가격'}
          </label>
          <input
            type="number"
            value={formBasePrice}
            onChange={(e) => onBasePriceChange(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="0"
          />
          {priceHint ? <p className="text-[11px] text-gray-400 mt-1">{priceHint}</p> : null}
        </div>
      )}
    </div>
  )
}
