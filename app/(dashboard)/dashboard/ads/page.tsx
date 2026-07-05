'use client'

import { useMemo, useState } from 'react'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import type { BusinessProductDisplayStatus } from '@/lib/ad-applications/types'
import { productCardStatusLabel } from '@/lib/ad-applications/utils'
import {
  AD_PRODUCTS,
  AUTOMATION_PRODUCTS,
  EXPOSURE_PRODUCTS,
  billingTypeLabel,
  getAdProduct,
  type AdProduct,
} from '@/lib/billing/catalog'
import { handleApplyAdProduct } from '@/lib/billing/handleApplyAdProduct'
import {
  getBusinessProductState,
  mockBusinessAdSummary,
} from '@/lib/mock/business-ad-products'
import { CARD, BTN_PRIMARY, SECTION_LABEL, won } from '@/lib/dashboard-ui'

const STATUS_BADGE_STYLE: Record<BusinessProductDisplayStatus, string> = {
  available: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  ended: 'bg-gray-100 text-gray-500',
}

function ProductRow({
  product,
  selected,
  displayStatus,
  disabled,
  onToggle,
}: {
  product: AdProduct
  selected: boolean
  displayStatus: BusinessProductDisplayStatus
  disabled: boolean
  onToggle: () => void
}) {
  const suffix = product.billingType === 'monthly' ? '/ 월' : ''
  const selectable = displayStatus === 'available' && !disabled

  return (
    <label
      className={`${CARD} flex items-start gap-3 transition-colors ${
        selectable ? 'cursor-pointer' : 'cursor-default opacity-90'
      } ${selected && selectable ? 'border-blue-300 bg-blue-50/50' : ''}`}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={!selectable}
        onChange={onToggle}
        className="rounded text-blue-600 shrink-0 mt-1 disabled:opacity-40"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-gray-900">{product.name}</p>
          <Badge className={STATUS_BADGE_STYLE[displayStatus]}>
            {productCardStatusLabel(displayStatus, product.billingType)}
          </Badge>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{product.description}</p>
        {(() => {
          const state = getBusinessProductState(product.id)
          if (state?.startDate && (displayStatus === 'active' || displayStatus === 'ended')) {
            return (
              <p className="text-[11px] text-gray-400 mt-1">
                {state.startDate?.replace(/-/g, '.')} ~ {state.endDate?.replace(/-/g, '.')}
              </p>
            )
          }
          return null
        })()}
      </div>
      <span className="text-sm font-semibold text-blue-600 shrink-0">
        +{won(product.price)}
        {suffix}
      </span>
    </label>
  )
}

export default function AdsPage() {
  const { isDemo } = useDemoMode()
  const [summary] = useState(mockBusinessAdSummary)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastApplied, setLastApplied] = useState<{ count: number; total: number } | null>(null)

  const selectedProducts = useMemo(
    () =>
      Array.from(selectedIds)
        .map((id) => getAdProduct(id))
        .filter((p): p is AdProduct => p !== undefined),
    [selectedIds],
  )

  const totalAmount = selectedProducts.reduce((sum, p) => sum + p.price, 0)

  function getDisplayStatus(productId: string): BusinessProductDisplayStatus {
    return getBusinessProductState(productId)?.displayStatus ?? 'available'
  }

  function toggle(id: string) {
    if (isDemo || getDisplayStatus(id) !== 'available') return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function onApply() {
    if (isDemo || selectedProducts.length === 0) return
    setSubmitting(true)
    await handleApplyAdProduct(selectedProducts)
    setSubmitting(false)
    setLastApplied({ count: selectedProducts.length, total: totalAmount })
    setModalOpen(true)
    setSelectedIds(new Set())
  }

  function renderSection(title: string, products: AdProduct[]) {
    return (
      <div>
        <p className={SECTION_LABEL}>{title}</p>
        <div className="space-y-2">
          {products.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              selected={selectedIds.has(p.id)}
              displayStatus={getDisplayStatus(p.id)}
              disabled={isDemo}
              onToggle={() => toggle(p.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className={CARD}>
        <p className={SECTION_LABEL}>현재 신청 · 광고 상태</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">현재 노출 범위</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{summary.exposureRange}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">진행 중 광고</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{summary.activeAdCount}건</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">신청 대기 상품</p>
            <p className="text-sm font-semibold text-amber-700 mt-1">{summary.pendingCount}건</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">자동화 이용 상태</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{summary.automationStatus}</p>
          </div>
        </div>
        {isDemo && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
            데모에서는 신청이 저장되지 않습니다.
          </p>
        )}
      </div>

      {renderSection('노출 확장', EXPOSURE_PRODUCTS)}
      {renderSection('광고 상품', AD_PRODUCTS)}
      {renderSection('자동화 기능', AUTOMATION_PRODUCTS)}

      <div className={CARD}>
        <p className={SECTION_LABEL}>선택한 상품</p>
        {selectedProducts.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">
            {isDemo ? '데모 모드에서는 상품을 선택할 수 없습니다.' : '신청 가능한 상품을 선택해 주세요.'}
          </p>
        ) : (
          <div className="space-y-3">
            {selectedProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{billingTypeLabel(p.billingType)}</p>
                </div>
                <p className="font-semibold text-gray-900">{won(p.price)}</p>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-600">합계</span>
              <span className="text-base font-bold text-blue-600">{won(totalAmount)}</span>
            </div>
            <p className="text-xs text-gray-400">VAT 별도 · PG 수수료 별도</p>
          </div>
        )}
        <button
          type="button"
          disabled={isDemo || selectedProducts.length === 0 || submitting}
          onClick={onApply}
          className={`${BTN_PRIMARY} w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isDemo ? '데모 · 신청 불가' : '결제 신청'}
        </button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="신청 접수" size="sm">
        <p className="text-sm text-gray-600 leading-relaxed">
          상품 신청이 접수되었습니다.
          <br />
          본사 확인 후 적용됩니다.
        </p>
        {lastApplied && (
          <p className="text-xs text-gray-400 mt-3">
            선택 {lastApplied.count}건 · 합계 {won(lastApplied.total)} (VAT 별도)
          </p>
        )}
        <button
          type="button"
          onClick={() => setModalOpen(false)}
          className={`${BTN_PRIMARY} w-full mt-5`}
        >
          확인
        </button>
      </Modal>
    </div>
  )
}
