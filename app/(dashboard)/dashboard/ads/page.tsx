'use client'

import { useCallback, useEffect, useState } from 'react'
import MetricCard from '@/components/ads/MetricCard'
import ProductCard from '@/components/ads/ProductCard'
import Modal from '@/components/ui/Modal'
import SlideUpSheet from '@/components/ui/SlideUpSheet'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import type { BusinessProductDisplayStatus } from '@/lib/ad-applications/types'
import {
  applicationsToProductStates,
  computeBusinessAdSummary,
  fetchBusinessAdApplications,
  getProductState,
  type BusinessAdApplicationRow,
} from '@/lib/ad-applications/business-api'
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
import { BTN_PRIMARY, SECTION_LABEL, won } from '@/lib/dashboard-ui'

function formatCompactSummary(count: number, monthly: number, oneTime: number): string {
  const parts: string[] = [`선택 ${count}건`]
  if (monthly > 0) parts.push(`월 ${won(monthly)}`)
  if (oneTime > 0) parts.push(`1회 ${won(oneTime)}`)
  return parts.join(' · ')
}

function formatPayButtonLabel(monthly: number, oneTime: number): string {
  const parts: string[] = []
  if (monthly > 0) parts.push(`${won(monthly)}/월`)
  if (oneTime > 0) parts.push(won(oneTime))
  return `${parts.join(' + ')} 결제하기`
}

function productUnitLabel(product: AdProduct): string {
  return product.billingType === 'monthly' ? '월 정기' : '1회 결제'
}

type ProductGridProps = {
  products: AdProduct[]
  productStates: ReturnType<typeof applicationsToProductStates>
  getDisplayStatus: (id: string) => BusinessProductDisplayStatus
  isProductDisabled: (product: AdProduct) => boolean
  isProductSelected: (id: string) => boolean
  onToggle: (id: string) => void
}

function ProductGrid({
  products,
  productStates,
  getDisplayStatus,
  isProductDisabled,
  isProductSelected,
  onToggle,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
      {products.map((product) => {
        const state = getProductState(productStates, product.id)
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
  const [productStates, setProductStates] = useState(() => applicationsToProductStates([]))
  const [summary, setSummary] = useState(() => computeBusinessAdSummary([]))
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [lastApplied, setLastApplied] = useState<{
    count: number
    monthly: number
    oneTime: number
  } | null>(null)
  const [gridEpoch, setGridEpoch] = useState(0)

  const refreshApplications = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const rows: BusinessAdApplicationRow[] = await fetchBusinessAdApplications()
      const states = applicationsToProductStates(rows)
      setProductStates(states)
      setSummary(computeBusinessAdSummary(states))
    } catch {
      setLoadError(true)
      setProductStates([])
      setSummary(computeBusinessAdSummary([]))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isDemo) {
      refreshApplications()
    } else {
      setLoading(false)
    }
  }, [isDemo, refreshApplications])

  const getDisplayStatus = useCallback(
    (productId: string): BusinessProductDisplayStatus =>
      getProductState(productStates, productId)?.displayStatus ?? 'available',
    [productStates],
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
      await refreshApplications()
      setGridEpoch((v) => v + 1)
      setCheckoutOpen(false)
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
          productStates={productStates}
          getDisplayStatus={getDisplayStatus}
          isProductDisabled={isProductDisabled}
          isProductSelected={isProductSelected}
          onToggle={toggleProduct}
        />
      </section>
    )
  }

  const hasSelection = selectedProducts.length > 0
  const compactSummary = formatCompactSummary(
    selectedProducts.length,
    paymentTotals.monthly,
    paymentTotals.oneTime,
  )
  const payButtonLabel = formatPayButtonLabel(paymentTotals.monthly, paymentTotals.oneTime)

  return (
    <div className={`space-y-5 ${hasSelection ? 'pb-[4.5rem]' : ''}`}>
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

      {loadError && !isDemo && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          광고 신청 내역을 불러오지 못했습니다.{' '}
          <button type="button" className="underline" onClick={refreshApplications}>
            다시 시도
          </button>
        </p>
      )}

      {loading && !isDemo ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : null}

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

      {hasSelection ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur safe-area-pb">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
              {compactSummary}
            </p>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => setCheckoutOpen(true)}
              className={`${BTN_PRIMARY} shrink-0 px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {isDemo ? '데모 · 신청 불가' : '결제 신청'}
            </button>
          </div>
        </div>
      ) : null}

      <SlideUpSheet
        open={checkoutOpen}
        onClose={() => {
          if (!submitting) setCheckoutOpen(false)
        }}
        title="결제 내역 확인"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setCheckoutOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={onApply}
              className={`${BTN_PRIMARY} flex-[1.4] py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {submitting ? '신청 중…' : payButtonLabel}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {selectedProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-start justify-between gap-3 border-b border-gray-50 pb-3 text-sm last:border-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {product.description} · {productUnitLabel(product)}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-gray-800">{won(product.price)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
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
            <span className="text-base font-bold text-blue-600">{won(paymentTotals.total)}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">VAT 별도 · PG 수수료 별도 · FCM 앱 푸시 전용</p>
        {applyError ? <p className="mt-2 text-xs text-red-600">{applyError}</p> : null}
      </SlideUpSheet>

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
