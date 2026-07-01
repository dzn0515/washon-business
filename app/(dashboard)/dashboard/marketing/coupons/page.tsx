'use client'

import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useCoupons, type CouponPayload } from '@/lib/hooks/useCoupons'
import { CARD, BTN_PRIMARY, won } from '@/lib/dashboard-ui'
import { createCoupon, setCouponActive, updateCoupon } from '@/lib/coupons-api'
import type { ApiCoupon } from '@/lib/coupons-api'

function formatDiscount(c: ApiCoupon) {
  return c.discount_type === 'amount' ? `${won(c.discount_value)} 할인` : `${c.discount_value}% 할인`
}

export default function MarketingCouponsPage() {
  const { coupons, loading, isLive, refetch } = useCoupons()
  const [modalOpen, setModalOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState<ApiCoupon | null>(null)
  const [formName, setFormName] = useState('')
  const [formDiscountType, setFormDiscountType] = useState<'amount' | 'percent'>('amount')
  const [formDiscountValue, setFormDiscountValue] = useState('5000')
  const [formMinOrder, setFormMinOrder] = useState('0')
  const [formValidFrom, setFormValidFrom] = useState('')
  const [formValidUntil, setFormValidUntil] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openAdd() {
    const today = new Date().toISOString().slice(0, 10)
    setEditCoupon(null)
    setFormName('')
    setFormDiscountType('amount')
    setFormDiscountValue('5000')
    setFormMinOrder('0')
    setFormValidFrom(today)
    setFormValidUntil(today)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(coupon: ApiCoupon) {
    setEditCoupon(coupon)
    setFormName(coupon.name)
    setFormDiscountType(coupon.discount_type)
    setFormDiscountValue(String(coupon.discount_value))
    setFormMinOrder(String(coupon.min_order_amount))
    setFormValidFrom(coupon.valid_from)
    setFormValidUntil(coupon.valid_until)
    setError(null)
    setModalOpen(true)
  }

  function buildPayload(): CouponPayload | null {
    const discount_value = Number(formDiscountValue)
    const min_order_amount = Number(formMinOrder)
    if (!formName.trim()) {
      setError('쿠폰 이름을 입력해주세요.')
      return null
    }
    if (!Number.isFinite(discount_value) || discount_value <= 0) {
      setError('할인 값을 확인해주세요.')
      return null
    }
    if (!formValidFrom || !formValidUntil) {
      setError('유효 기간을 입력해주세요.')
      return null
    }
    return {
      name: formName.trim(),
      discount_type: formDiscountType,
      discount_value,
      min_order_amount: Number.isFinite(min_order_amount) ? min_order_amount : 0,
      valid_from: formValidFrom,
      valid_until: formValidUntil,
    }
  }

  async function handleSave() {
    const payload = buildPayload()
    if (!payload) return
    setSaving(true)
    setError(null)
    try {
      if (editCoupon) {
        await updateCoupon(editCoupon.id, payload)
      } else {
        await createCoupon({ ...payload, is_active: true })
      }
      setModalOpen(false)
      await refetch()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(coupon: ApiCoupon) {
    if (!isLive) return
    try {
      await setCouponActive(coupon.id, !coupon.is_active)
      await refetch()
    } catch (e) {
      console.log('[coupons] toggle active failed', e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">쿠폰 관리</h2>
          <p className="text-xs text-gray-400 mt-1">고객에게 발급할 쿠폰 템플릿을 관리합니다.</p>
        </div>
        <button type="button" onClick={openAdd} className={`${BTN_PRIMARY} flex items-center gap-1 shrink-0`}>
          <Plus size={14} /> 쿠폰 만들기
        </button>
      </div>

      {!isLive && !loading ? <p className="text-xs text-amber-600">데모 데이터 표시 중</p> : null}
      {loading ? <p className="text-sm text-gray-400">불러오는 중...</p> : null}

      <div className="space-y-2">
        {coupons.map((coupon) => (
          <div key={coupon.id} className={`${CARD} ${!coupon.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{coupon.name}</span>
                  <Badge className={coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {coupon.is_active ? '활성' : '비활성'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDiscount(coupon)} · 최소 {won(coupon.min_order_amount)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {coupon.valid_from} ~ {coupon.valid_until}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(coupon)}
                  className="p-2 text-gray-400 hover:text-gray-700"
                  aria-label="수정"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  disabled={!isLive}
                  onClick={() => void toggleActive(coupon)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50"
                >
                  {coupon.is_active ? '비활성화' : '활성화'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && coupons.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 쿠폰이 없습니다.</p>
        ) : null}
      </div>

      <Modal open={modalOpen} title={editCoupon ? '쿠폰 수정' : '쿠폰 만들기'} onClose={() => setModalOpen(false)}>
        <div className="space-y-3">
          <label className="block text-xs text-gray-500">
            쿠폰 이름
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-gray-500">
              할인 유형
              <select
                value={formDiscountType}
                onChange={(e) => setFormDiscountType(e.target.value as 'amount' | 'percent')}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="amount">정액</option>
                <option value="percent">정률</option>
              </select>
            </label>
            <label className="block text-xs text-gray-500">
              할인 값
              <input
                value={formDiscountValue}
                onChange={(e) => setFormDiscountValue(e.target.value)}
                type="number"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block text-xs text-gray-500">
            최소 주문 금액
            <input
              value={formMinOrder}
              onChange={(e) => setFormMinOrder(e.target.value)}
              type="number"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-gray-500">
              시작일
              <input
                value={formValidFrom}
                onChange={(e) => setFormValidFrom(e.target.value)}
                type="date"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs text-gray-500">
              종료일
              <input
                value={formValidUntil}
                onChange={(e) => setFormValidUntil(e.target.value)}
                type="date"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className={`${BTN_PRIMARY} w-full py-2.5 disabled:opacity-50`}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
