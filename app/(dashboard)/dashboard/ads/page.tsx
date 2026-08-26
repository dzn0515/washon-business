'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import MetricCard from '@/components/ads/MetricCard'
import ProductCard from '@/components/ads/ProductCard'
import Modal from '@/components/ui/Modal'
import SlideUpSheet from '@/components/ui/SlideUpSheet'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import type { BusinessProductDisplayStatus } from '@/lib/ad-applications/types'
import {
  applicationsToProductStates,
  catalogItemToAdProduct,
  computeBusinessAdSummary,
  fetchBusinessAdApplications,
  fetchBusinessAdProducts,
  fetchPremiumEligibility,
  formatDefaultExposureLabel,
  getProductState,
  type BusinessAdApplicationRow,
  type PremiumEligibility,
} from '@/lib/ad-applications/business-api'
import { formatDisplayDate } from '@/lib/ad-applications/utils'
import {
  AD_PRODUCTS,
  AUTOMATION_BUNDLE_DISCOUNT_BADGE,
  AUTOMATION_PRODUCTS,
  DEFAULT_EXPOSURE_RADIUS_METERS,
  PREMIUM_EXPOSURE_PRODUCT,
  REGIONAL_EXPOSURE_PRODUCTS,
  type AdProduct,
} from '@/lib/billing/catalog'
import { isExposureProductId } from '@/lib/billing/ad-product-selection'
import { handleApplyAdProduct } from '@/lib/billing/handleApplyAdProduct'
import { savePendingSaasCheckout } from '@/lib/billing/pendingCheckout'
import { requestTossBillingAuth } from '@/lib/billing/tossBilling'
import { vatQuote } from '@/lib/billing/vat'
import ChargeBreakdown from '@/components/billing/ChargeBreakdown'
import { fetchBillingMethods } from '@/lib/business-payments-api'
import {
  fetchSaasBillingConfig,
  fetchSaasBillingQuote,
  type SaasBillingConfig,
  type SaasBillingMethod,
  type SaasBillingQuote,
} from '@/lib/saas-billing-api'
import { useAdProductSelection } from '@/lib/hooks/useAdProductSelection'
import { BTN_PRIMARY, SECTION_LABEL, won } from '@/lib/dashboard-ui'

const PREMIUM_BENEFITS = [
  '홈 추천 매장 후보 포함',
  '광고 영역 우선 노출',
  'Premium 배지 제공',
  '관리자 승인 후 활성화',
]

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
  blockedBySku?: Record<string, string>
}

function ProductGrid({
  products,
  productStates,
  getDisplayStatus,
  isProductDisabled,
  isProductSelected,
  onToggle,
  blockedBySku,
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
        const statusHint = blockedBySku?.[product.id] ?? null

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
              (product.id === 'auto-birthday' || product.id === 'auto-revisit') &&
              (displayStatus === 'active' || Boolean(statusHint?.includes('포함')))
            }
            statusHint={statusHint}
          />
        )
      })}
    </div>
  )
}

function DefaultExposureInfoCard({
  radiusMeters,
  planTier,
  effectiveMeters,
  activeAdMeters,
}: {
  radiusMeters: number
  planTier: string | null
  effectiveMeters: number | null
  activeAdMeters: number | null
}) {
  const planLabel = planTier ? planTier.charAt(0) + planTier.slice(1).toLowerCase() : null
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm space-y-1">
      <p className="text-sm font-semibold text-gray-900">
        {formatDefaultExposureLabel(radiusMeters)}
        {planLabel ? ` · ${planLabel} 플랜 포함` : ''}
      </p>
      <p className="text-xs text-gray-600">구독 포함 노출 · 별도 신청 불필요</p>
      {planTier === 'PREMIUM' ? (
        <p className="text-xs text-teal-700 font-medium">
          현재 Premium 플랜에 1.5km 노출이 포함되어 있습니다.
        </p>
      ) : null}
      {effectiveMeters != null ? (
        <p className="text-xs text-gray-500">
          최종 적용 반경 {effectiveMeters >= 1000 ? `${effectiveMeters / 1000}km` : `${effectiveMeters}m`}
          {activeAdMeters != null ? ` (별도 광고 ${activeAdMeters}m)` : ' (별도 광고 없음)'}
        </p>
      ) : null}
    </div>
  )
}

export default function AdsPage() {
  const { isDemo } = useDemoMode()
  const [productStates, setProductStates] = useState(() => applicationsToProductStates([]))
  const [summary, setSummary] = useState(() => computeBusinessAdSummary([]))
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [regionalProducts, setRegionalProducts] = useState<AdProduct[]>(REGIONAL_EXPOSURE_PRODUCTS)
  const [premiumProduct, setPremiumProduct] = useState<AdProduct>(PREMIUM_EXPOSURE_PRODUCT)
  const [defaultRadiusMeters, setDefaultRadiusMeters] = useState(DEFAULT_EXPOSURE_RADIUS_METERS)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [effectiveRadiusMeters, setEffectiveRadiusMeters] = useState<number | null>(null)
  const [activeAdRadiusMeters, setActiveAdRadiusMeters] = useState<number | null>(null)
  const [blockedBySku, setBlockedBySku] = useState<Record<string, string>>({})
  const [canUseAutomation, setCanUseAutomation] = useState<boolean | null>(null)
  const [premiumEligibility, setPremiumEligibility] = useState<PremiumEligibility | null>(null)
  const [premiumBenefits, setPremiumBenefits] = useState<string[]>(PREMIUM_BENEFITS)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [lastApplied, setLastApplied] = useState<{
    count: number
    monthly: number
    oneTime: number
    charged?: number
  } | null>(null)
  const [gridEpoch, setGridEpoch] = useState(0)
  const [billingConfig, setBillingConfig] = useState<SaasBillingConfig | null>(null)
  const [billingMethods, setBillingMethods] = useState<SaasBillingMethod[]>([])
  const [selectedMethodId, setSelectedMethodId] = useState<number | 'new'>('new')
  const [adQuote, setAdQuote] = useState<SaasBillingQuote | null>(null)

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

  const refreshCatalog = useCallback(async () => {
    try {
      const [products, eligibility] = await Promise.all([
        fetchBusinessAdProducts(),
        fetchPremiumEligibility(),
      ])
      const regional =
        products.regional?.map(catalogItemToAdProduct) ??
        products.products
          .filter((p) => p.tier !== 'PREMIUM' && p.sku !== 'exposure-10km-premium')
          .map(catalogItemToAdProduct)
      const premiumItem =
        products.premium ??
        products.products.find((p) => p.sku === 'exposure-10km-premium' || p.tier === 'PREMIUM')
      setRegionalProducts(regional.length ? regional : REGIONAL_EXPOSURE_PRODUCTS)
      if (premiumItem) {
        setPremiumProduct(catalogItemToAdProduct(premiumItem))
        if (premiumItem.benefits?.length) setPremiumBenefits(premiumItem.benefits)
      }
      setDefaultRadiusMeters(
        products.included_exposure_radius_meters ??
          products.default_exposure?.radius_meters ??
          products.default_exposure_radius_meters ??
          DEFAULT_EXPOSURE_RADIUS_METERS,
      )
      setCurrentPlan(products.current_plan ?? null)
      setEffectiveRadiusMeters(products.effective_exposure_radius_meters ?? null)
      setActiveAdRadiusMeters(products.active_ad_radius_meters ?? null)
      setCanUseAutomation(products.can_use_automation ?? null)
      const blocked: Record<string, string> = {}
      for (const item of [...(products.products ?? []), ...(products.other ?? [])]) {
        if (!item.purchasable && item.blocked_reason) {
          blocked[item.sku] = item.blocked_reason
        }
      }
      setBlockedBySku(blocked)
      setPremiumEligibility(eligibility)
    } catch {
      setRegionalProducts(REGIONAL_EXPOSURE_PRODUCTS)
      setPremiumProduct(PREMIUM_EXPOSURE_PRODUCT)
      setDefaultRadiusMeters(DEFAULT_EXPOSURE_RADIUS_METERS)
      setCurrentPlan(null)
      setEffectiveRadiusMeters(null)
      setActiveAdRadiusMeters(null)
      setCanUseAutomation(null)
      setBlockedBySku({})
      setPremiumEligibility(null)
      setPremiumBenefits(PREMIUM_BENEFITS)
    }
  }, [])

  useEffect(() => {
    if (!isDemo) {
      void refreshApplications()
      void refreshCatalog()
    } else {
      setLoading(false)
    }
  }, [isDemo, refreshApplications, refreshCatalog])

  useEffect(() => {
    if (isDemo) return
    let cancelled = false
    ;(async () => {
      try {
        const [cfg, methods] = await Promise.all([fetchSaasBillingConfig(), fetchBillingMethods()])
        if (cancelled) return
        setBillingConfig(cfg)
        setBillingMethods(methods.items)
        const def = methods.items.find((m) => m.is_default)
        setSelectedMethodId(def?.id ?? 'new')
      } catch {
        /* checkout still handles missing config */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isDemo])

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

  const isProductDisabledWithEligibility = useCallback(
    (product: AdProduct): boolean => {
      if (blockedBySku[product.id]) return true
      if (
        product.id === 'exposure-10km-premium' &&
        premiumEligibility &&
        !premiumEligibility.eligible
      ) {
        return true
      }
      if (product.category === 'automation' && canUseAutomation === true) {
        return true
      }
      if (product.category === 'automation' && canUseAutomation === false) {
        return true
      }
      return isProductDisabled(product)
    },
    [blockedBySku, isProductDisabled, premiumEligibility, canUseAutomation],
  )

  const premiumBlockingReasons = useMemo(
    () => premiumEligibility?.blockingReasons ?? [],
    [premiumEligibility],
  )

  const canSubmit = !isDemo && selectedProducts.length > 0 && !submitting

  async function onApply() {
    if (!canSubmit) return
    setSubmitting(true)
    setApplyError(null)
    try {
      const exposureItems = selectedProducts.filter((p) => isExposureProductId(p.id))
      const cfg = billingConfig ?? (await fetchSaasBillingConfig().catch(() => null))
      if (exposureItems.length > 0) {
        if (!cfg?.billing_available) {
          throw new Error('광고 결제가 아직 연결되지 않았습니다.')
        }
        const useExisting = selectedMethodId !== 'new' && typeof selectedMethodId === 'number'
        if (!useExisting && cfg.widget === 'requestBillingAuth' && cfg.payment_gateway === 'toss') {
          savePendingSaasCheckout({
            kind: 'ad',
            productIds: exposureItems.map((p) => p.id),
            applicationProductIds: selectedProducts
              .filter((p) => !isExposureProductId(p.id))
              .map((p) => p.id),
          })
          await requestTossBillingAuth({
            clientKey: cfg.client_key,
            customerKey: cfg.customer_key,
            successUrl: `${window.location.origin}/dashboard/billing/callback`,
            failUrl: `${window.location.origin}/dashboard/ads?billing=fail`,
          })
          return
        }
      }
      const result = await handleApplyAdProduct(selectedProducts, {
        billingMethodId: selectedMethodId === 'new' ? undefined : selectedMethodId,
        authKey:
          selectedMethodId === 'new' && exposureItems.length > 0 ? 'mock_auth' : undefined,
        customerKey: cfg?.customer_key,
      })
      if (!result.success) {
        setApplyError('신청에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      const exposureSupply = exposureItems.reduce((sum, p) => sum + p.price, 0)
      setLastApplied({
        count: result.items.length,
        monthly: paymentTotals.monthly,
        oneTime: paymentTotals.oneTime,
        charged: exposureSupply > 0 ? vatQuote(exposureSupply).charge_amount : undefined,
      })
      clearSelection()
      await refreshApplications()
      setGridEpoch((v) => v + 1)
      setCheckoutOpen(false)
      setModalOpen(true)
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : '결제에 실패했습니다. 잠시 후 다시 시도해 주세요.')
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
          isProductDisabled={isProductDisabledWithEligibility}
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

      <section>
        <p className={SECTION_LABEL}>지역 노출</p>
        <div className="mb-3">
          <DefaultExposureInfoCard
            radiusMeters={defaultRadiusMeters}
            planTier={currentPlan}
            effectiveMeters={effectiveRadiusMeters}
            activeAdMeters={activeAdRadiusMeters}
          />
        </div>
        {Object.keys(blockedBySku).length > 0 ? (
          <ul className="mb-3 space-y-1 text-xs text-amber-700">
            {Object.entries(blockedBySku)
              .filter(([sku]) => sku.startsWith('exposure-'))
              .map(([sku, reason]) => (
                <li key={sku}>
                  {sku}: {reason}
                </li>
              ))}
          </ul>
        ) : null}
        <ProductGrid
          key={`regional-${gridEpoch}`}
          products={regionalProducts}
          productStates={productStates}
          getDisplayStatus={getDisplayStatus}
          isProductDisabled={isProductDisabledWithEligibility}
          isProductSelected={isProductSelected}
          onToggle={toggleProduct}
          blockedBySku={blockedBySku}
        />
            <p className="mt-2 text-xs text-gray-500">
          지역 노출 요금은 VAT 별도입니다. 카드 청구 시 10% VAT가 포함됩니다. (1km / 1.5km / 3km)
        </p>
      </section>

      <section>
        <p className={SECTION_LABEL}>10km 프리미엄</p>
        <div className="mb-3 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
          <p className="text-sm font-semibold text-gray-900">{premiumProduct.name}</p>
          <p className="mt-1 text-xs text-gray-600">
            월 {won(premiumProduct.price)} · VAT 별도 · 청구 {won(vatQuote(premiumProduct.price).charge_amount)}
          </p>
          <p className="mt-2 text-xs text-gray-600">
            반경 10km 이내 고객에게 노출됩니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-gray-600">
            {premiumBenefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </div>
        {premiumBlockingReasons.length > 0 ? (
          <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
            <p className="text-xs font-medium text-amber-800">10km 프리미엄 신청 조건 미충족</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-amber-700">
              {premiumBlockingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <ProductGrid
          key={`premium-${gridEpoch}`}
          products={[premiumProduct]}
          productStates={productStates}
          getDisplayStatus={getDisplayStatus}
          isProductDisabled={isProductDisabledWithEligibility}
          isProductSelected={isProductSelected}
          onToggle={toggleProduct}
          blockedBySku={blockedBySku}
        />
      </section>

      {renderSection('광고 상품', AD_PRODUCTS)}
      <section>
        <p className={SECTION_LABEL}>자동화 기능</p>
        {canUseAutomation === true ? (
          <div className="mb-3 space-y-2">
            <p className="text-xs text-teal-700">
              Standard 이상 플랜에 자동화(재방문·생일쿠폰·리뷰요청)가 포함되어 있습니다. 별도 구매가
              필요하지 않습니다.
            </p>
            <ul className="rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-3 text-sm text-gray-800 space-y-1.5">
              {AUTOMATION_PRODUCTS.filter((p) => p.id !== 'auto-bundle').map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>{p.name}</span>
                  <span className="text-xs font-semibold text-teal-700">포함됨</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/ads/revisit-reminder"
                className="inline-block text-xs font-medium text-blue-600 hover:underline"
              >
                재방문 알림 설정 →
              </Link>
              <Link
                href="/dashboard/ads/birthday-coupon"
                className="inline-block text-xs font-medium text-blue-600 hover:underline"
              >
                생일 쿠폰 설정 →
              </Link>
            </div>
          </div>
        ) : canUseAutomation === false ? (
          <div className="mb-3 space-y-2">
            <p className="text-xs text-amber-700">
              자동화 기능은 Standard 플랜부터 사용할 수 있습니다.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-block text-xs font-medium text-blue-600 hover:underline"
            >
              Standard로 업그레이드 →
            </Link>
            <ul className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500 space-y-1.5">
              {AUTOMATION_PRODUCTS.filter((p) => p.id !== 'auto-bundle').map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>{p.name}</span>
                  <span className="text-xs">잠금</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ProductGrid
            key={`automation-${gridEpoch}`}
            products={AUTOMATION_PRODUCTS}
            productStates={productStates}
            getDisplayStatus={getDisplayStatus}
            isProductDisabled={isProductDisabledWithEligibility}
            isProductSelected={isProductSelected}
            onToggle={toggleProduct}
            blockedBySku={blockedBySku}
          />
        )}
      </section>

      {hasSelection ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur safe-area-pb">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
              {compactSummary}
            </p>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={async () => {
                setCheckoutOpen(true)
                const exposure = selectedProducts.filter((p) => isExposureProductId(p.id))
                if (exposure.length === 1) {
                  try {
                    setAdQuote(
                      await fetchSaasBillingQuote({ kind: 'ad', productId: exposure[0].id }),
                    )
                  } catch {
                    setAdQuote(null)
                  }
                } else {
                  setAdQuote(null)
                }
              }}
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
              <span>월 이용료 (VAT 별도)</span>
              <span className="font-semibold">{won(paymentTotals.monthly)}</span>
            </div>
          ) : null}
          {paymentTotals.oneTime > 0 ? (
            <div className="flex justify-between text-gray-600">
              <span>1회 결제 (VAT 별도)</span>
              <span className="font-semibold">{won(paymentTotals.oneTime)}</span>
            </div>
          ) : null}
          {selectedProducts.some((p) => isExposureProductId(p.id)) ? (
            <ChargeBreakdown
              quote={
                adQuote ?? {
                  kind: 'ad',
                  order_name: 'AUTOON 광고상품',
                  ...vatQuote(
                    selectedProducts
                      .filter((p) => isExposureProductId(p.id))
                      .reduce((sum, p) => sum + p.price, 0),
                  ),
                }
              }
            />
          ) : (
            <div className="flex justify-between pt-1">
              <span className="font-medium text-gray-700">합계</span>
              <span className="text-base font-bold text-blue-600">{won(paymentTotals.total)}</span>
            </div>
          )}
        </div>
        {billingMethods.length > 0 ? (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-medium text-gray-500">결제 카드</p>
            {billingMethods.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name="ad-billing-method"
                  checked={selectedMethodId === m.id}
                  onChange={() => setSelectedMethodId(m.id)}
                />
                {m.card_company ?? m.provider} {m.card_number_masked}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-gray-800">
              <input
                type="radio"
                name="ad-billing-method"
                checked={selectedMethodId === 'new'}
                onChange={() => setSelectedMethodId('new')}
              />
              새 카드 등록
            </label>
          </div>
        ) : null}
        <p className="mt-3 text-xs text-gray-400">
          지역 노출·10km Premium은 카드 결제 후 활성화됩니다. 그 외 상품은 신청 접수입니다. 카드정보는
          AUTOON에 저장하지 않습니다.
        </p>
        {applyError ? <p className="mt-2 text-xs text-red-600">{applyError}</p> : null}
      </SlideUpSheet>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="결제 완료" size="sm">
        <p className="text-sm leading-relaxed text-gray-600">
          광고상품 결제가 완료되었습니다. 지역 노출은 바로 활성화되며, 10km Premium은 관리자 승인 후
          적용됩니다.
        </p>
        {lastApplied ? (
          <p className="mt-3 text-xs text-gray-400">
            선택 {lastApplied.count}건 · 월 {won(lastApplied.monthly)}
            {lastApplied.charged ? ` · 카드 청구 ${won(lastApplied.charged)}` : ''}
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
