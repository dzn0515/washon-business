'use client'

import { useCallback, useState } from 'react'
import MetricCard from '@/components/ads/MetricCard'
import ProductCard from '@/components/ads/ProductCard'
import Modal from '@/components/ui/Modal'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import type { BusinessProductDisplayStatus } from '@/lib/ad-applications/types'
import { formatDisplayDate } from '@/lib/ad-applications/utils'
import {
  AD_PRODUCTS,
  AUTOMATION_BUNDLE_DISCOUNT_BADGE,
  AUTOMATION_PRODUCTS,
  EXPOSURE_PRODUCTS,
  type AdProduct,
} from '@/lib/billing/catalog'
import { handleApplyAdProduct } from '@/lib/billing/handleApplyAdProduct'
import { useAdProductSelection } from '@/lib/hooks/useAdProductSelection'
import {
  computeBusinessAdSummary,
  getBusinessProductState,
  getBusinessProductStates,
} from '@/lib/mock/business-ad-products'
import { BTN_PRIMARY, CARD, SECTION_LABEL, won } from '@/lib/dashboard-ui'

type ProductGridProps = {
  products: AdProduct[]
  getDisplayStatus: (id: string) => BusinessProductDisplayStatus
  isProductDisabled: (product: AdProduct) => boolean
  isProductSelected: (id: string) => boolean
  onToggle: (id: string) => void
}

function ProductGrid({
  products,
  getDisplayStatus,
  isProductDisabled,
  isProductSelected,
  onToggle,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
      {products.map((product) => {
        const state = getBusinessProductState(product.id)
        const displayStatus = getDisplayStatus(product.id)
        const periodText =
          state?.startDate && (displayStatus === 'active' || displayStatus === 'ended')
            ? `${formatDisplayDate(state.startDate)} ~ ${formatDisplayDate(state.endDate)}`
            : null

        return (
          <ProductCard
            key={product.id}
            product={product}
            displayStatus={displayStatus}
            selected={isProductSelected(product.id)}
            disabled={isProductDisabled(product)}
            onPress={onToggle}
            periodText={periodText}
            discountBadge={
              product.id === 'auto-bundle' ? AUTOMATION_BUNDLE_DISCOUNT_BADGE : null
            }
            showSettings={
              product.id === 'auto-birthday' && displayStatus === 'active'
            }
          />
        )
      })}
    </div>
  )
}

export default function AdsPage() {
  const { isDemo } = useDemoMode()
  const [summary, setSummary] = useState(() =>
    computeBusinessAdSummary(getBusinessProductStates()),
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [lastApplied, setLastApplied] = useState<{
    count: number
    monthly: number
    oneTime: number
  } | null>(null)
  const [gridEpoch, setGridEpoch] = useState(0)

  const getDisplayStatus = useCallback(
    (productId: string): BusinessProductDisplayStatus =>
      getBusinessProductState(productId)?.displayStatus ?? 'available',
    [],
  )

  const {
    selectedProducts,
    paymentTotals,
    exposureNotice,
    toggleProduct,
    clearSelection,
    isProductDisabled,
    isProductSelected,
  } = useAdProductSelection({
    getDisplayStatus,
    disabled: isDemo,
  })

  const canSubmit = !isDemo && selectedProducts.length > 0 && !submitting

  async function onApply() {
    if (!canSubmit) return
    setSubmitting(true)
    setApplyError(null)
    try {
      const result = await handleApplyAdProduct(selectedProducts)
      if (!result.success) {
        setApplyError('신청에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      setLastApplied({
        count: result.items.length,
        monthly: paymentTotals.monthly,
        oneTime: paymentTotals.oneTime,
      })
      clearSelection()
      setSummary(computeBusinessAdSummary(getBusinessProductStates()))
      setGridEpoch((v) => v + 1)
      setModalOpen(true)
    } catch {
      setApplyError('신청에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  function renderSection(title: string, products: AdProduct[]) {
    return (
      <section>
        <p className={SECTION_LABEL}>{title}</p>
        <ProductGrid
          key={`${title}-${gridEpoch}`}
          products={products}
          getDisplayStatus={getDisplayStatus}
          isProductDisabled={isProductDisabled}
          isProductSelected={isProductSelected}
          onToggle={toggleProduct}
        />
      </section>
    )
  }

  return (
    <div className="pb-44 space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="현재 노출 범위" value={summary.exposureRange} />
        <MetricCard
          label="진행 중 광고"
          value={`${summary.activeAdCount}건`}
          tone={summary.activeAdCount > 0 ? 'success' : 'default'}
        />
        <MetricCard
          label="신청 대기 상품"
          value={`${summary.pendingCount}건`}
          tone={summary.pendingCount > 0 ? 'warning' : 'default'}
        />
        <MetricCard label="자동화 이용 상태" value={summary.automationStatus} />
      </div>

      {isDemo && (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          데모에서는 신청이 저장되지 않습니다.
        </p>
      )}

      {exposureNotice ? (
        <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          {exposureNotice}
        </p>
      ) : null}

      {renderSection('노출 확장', EXPOSURE_PRODUCTS)}
      {renderSection('광고 상품', AD_PRODUCTS)}
      {renderSection('자동화 기능', AUTOMATION_PRODUCTS)}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className={`${CARD} mx-auto max-w-3xl shadow-lg`}>
          <p className={SECTION_LABEL}>선택한 상품</p>
          {selectedProducts.length === 0 ? (
            <p className="py-2 text-sm text-gray-400">
              {isDemo
                ? '데모 모드에서는 상품을 선택할 수 없습니다.'
                : '신청 가능한 상품을 선택해 주세요.'}
            </p>
          ) : (
            <div className="space-y-2">
              {selectedProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <span className="font-semibold text-gray-800">{won(p.price)}</span>
                </div>
              ))}
              <div className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-sm">
                {paymentTotals.monthly > 0 ? (
                  <div className="flex justify-between text-gray-600">
                    <span>월 정기 결제</span>
                    <span className="font-semibold">{won(paymentTotals.monthly)}</span>
                  </div>
                ) : null}
                {paymentTotals.oneTime > 0 ? (
                  <div className="flex justify-between text-gray-600">
                    <span>1회 결제</span>
                    <span className="font-semibold">{won(paymentTotals.oneTime)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-1">
                  <span className="font-medium text-gray-700">합계</span>
                  <span className="text-base font-bold text-blue-600">
                    {won(paymentTotals.total)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400">VAT 별도 · PG 수수료 별도 · FCM 앱 푸시 전용</p>
            </div>
          )}
          {applyError ? <p className="mt-2 text-xs text-red-600">{applyError}</p> : null}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onApply}
            className={`${BTN_PRIMARY} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isDemo ? '데모 · 신청 불가' : submitting ? '신청 중…' : '결제 신청'}
          </button>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="신청 접수" size="sm">
        <p className="text-sm leading-relaxed text-gray-600">
          상품 신청이 접수되었습니다.
          <br />
          본사 확인 후 적용됩니다.
        </p>
        {lastApplied ? (
          <p className="mt-3 text-xs text-gray-400">
            선택 {lastApplied.count}건 · 월 {won(lastApplied.monthly)} · 1회{' '}
            {won(lastApplied.oneTime)} (VAT 별도)
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setModalOpen(false)}
          className={`${BTN_PRIMARY} mt-5 w-full`}
        >
          확인
        </button>
      </Modal>
    </div>
  )
}
