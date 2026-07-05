'use client'

import { useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import {
  AD_PRODUCTS,
  AUTOMATION_PRODUCTS,
  EXPOSURE_PRODUCTS,
  billingTypeLabel,
  getAdProduct,
  type AdProduct,
} from '@/lib/billing/catalog'
import { handleApplyAdProduct } from '@/lib/billing/handleApplyAdProduct'
import { mockAds } from '@/lib/mock/data'
import { CARD, BTN_PRIMARY, SECTION_LABEL, won } from '@/lib/dashboard-ui'

function ProductRow({
  product,
  selected,
  onToggle,
}: {
  product: AdProduct
  selected: boolean
  onToggle: () => void
}) {
  const suffix = product.billingType === 'monthly' ? '/ 월' : ''
  return (
    <label
      className={`${CARD} flex items-center gap-3 cursor-pointer transition-colors ${
        selected ? 'border-blue-300 bg-blue-50/50' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="rounded text-blue-600 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{product.name}</p>
        <p className="text-xs text-gray-400">{product.description}</p>
      </div>
      <span className="text-sm font-semibold text-blue-600 shrink-0">
        +{won(product.price)}{suffix}
      </span>
    </label>
  )
}

export default function AdsPage() {
  const { isDemo } = useDemoMode()
  const [ads] = useState(mockAds)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const selectedProducts = useMemo(
    () =>
      Array.from(selectedIds)
        .map((id) => getAdProduct(id))
        .filter((p): p is AdProduct => p !== undefined),
    [selectedIds],
  )

  const totalAmount = selectedProducts.reduce((sum, p) => sum + p.price, 0)

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function onApply() {
    if (selectedProducts.length === 0) return
    setSubmitting(true)
    await handleApplyAdProduct(selectedProducts)
    setSubmitting(false)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className={CARD}>
        <p className={SECTION_LABEL}>현재 상태</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">현재 노출 상태</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{ads.exposure_status}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">현재 광고 상태</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{ads.ad_status}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">현재 자동화 상태</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{ads.automation_status}</p>
          </div>
        </div>
        {isDemo && (
          <p className="text-xs text-gray-400 mt-3">데모 모드 · Mock 데이터 · 실제 결제 없음</p>
        )}
      </div>

      <div>
        <p className={SECTION_LABEL}>노출 확장</p>
        <div className="space-y-2">
          {EXPOSURE_PRODUCTS.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              selected={selectedIds.has(p.id)}
              onToggle={() => toggle(p.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className={SECTION_LABEL}>광고 상품</p>
        <div className="space-y-2">
          {AD_PRODUCTS.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              selected={selectedIds.has(p.id)}
              onToggle={() => toggle(p.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className={SECTION_LABEL}>자동화 기능</p>
        <div className="space-y-2">
          {AUTOMATION_PRODUCTS.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              selected={selectedIds.has(p.id)}
              onToggle={() => toggle(p.id)}
            />
          ))}
        </div>
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>선택한 상품</p>
        {selectedProducts.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">상품을 선택해 주세요.</p>
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
              <span className="text-sm text-gray-600">합계 (VAT 별도)</span>
              <span className="text-base font-bold text-blue-600">{won(totalAmount)}</span>
            </div>
            <p className="text-xs text-gray-400">VAT 별도 · PG 수수료 별도</p>
          </div>
        )}
        <button
          type="button"
          disabled={selectedProducts.length === 0 || submitting}
          onClick={onApply}
          className={`${BTN_PRIMARY} w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          결제 신청
        </button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="신청 접수" size="sm">
        <p className="text-sm text-gray-600 leading-relaxed">
          상품 신청이 접수되었습니다.
          <br />
          담당자가 확인 후 안내드립니다.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          선택 {selectedProducts.length}건 · 합계 {won(totalAmount)} (VAT 별도)
        </p>
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
