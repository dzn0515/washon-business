'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/ads/StatusBadge'
import type { BusinessProductDisplayStatus } from '@/lib/ad-applications/types'
import type { AdProduct } from '@/lib/billing/catalog'
import { won } from '@/lib/dashboard-ui'

export type ProductCardProps = {
  product: AdProduct
  displayStatus: BusinessProductDisplayStatus
  selected: boolean
  disabled: boolean
  onPress: (productId: string) => void
  periodText?: string | null
  discountBadge?: string | null
  showSettings?: boolean
}

function ProductCardInner({
  product,
  displayStatus,
  selected,
  disabled,
  onPress,
  periodText,
  discountBadge,
  showSettings,
}: ProductCardProps) {
  const router = useRouter()
  const suffix = product.billingType === 'monthly' ? '/월' : ''
  const clickable = !disabled && displayStatus !== 'pending' && displayStatus !== 'active'

  return (
    <div
      role="button"
      tabIndex={clickable ? 0 : -1}
      onClick={() => {
        if (clickable) onPress(product.id)
      }}
      onKeyDown={(e) => {
        if (!clickable) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPress(product.id)
        }
      }}
      className={`relative flex h-full flex-col rounded-xl border bg-white p-4 shadow-sm transition-colors ${
        clickable ? 'cursor-pointer hover:border-blue-200' : 'cursor-default opacity-90'
      } ${selected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-100'}`}
      style={selected ? { borderWidth: 2 } : undefined}
    >
      <div className="absolute right-3 top-3">
        <StatusBadge status={displayStatus} billingType={product.billingType} />
      </div>

      {discountBadge ? (
        <span className="mb-2 inline-flex w-fit rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
          {discountBadge}
        </span>
      ) : (
        <span className="mb-2 h-[18px]" aria-hidden />
      )}

      <p className="pr-16 text-sm font-semibold text-gray-900">{product.name}</p>
      <p className="mt-1 text-xs text-gray-400">{product.description}</p>
      {periodText ? <p className="mt-1 text-[11px] text-gray-400">{periodText}</p> : null}

      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <p className="text-sm font-bold text-blue-600">
          +{won(product.price)}
          {suffix}
        </p>
        {showSettings ? (
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation()
              router.push('/dashboard/ads/birthday-coupon')
            }}
          >
            설정
          </button>
        ) : null}
      </div>
    </div>
  )
}

function propsAreEqual(prev: ProductCardProps, next: ProductCardProps) {
  return (
    prev.product.id === next.product.id &&
    prev.displayStatus === next.displayStatus &&
    prev.selected === next.selected &&
    prev.disabled === next.disabled &&
    prev.periodText === next.periodText &&
    prev.discountBadge === next.discountBadge &&
    prev.showSettings === next.showSettings
  )
}

const ProductCard = memo(ProductCardInner, propsAreEqual)
ProductCard.displayName = 'ProductCard'

export default ProductCard
