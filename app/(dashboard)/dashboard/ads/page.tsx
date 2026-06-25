'use client'
import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import { useAds } from '@/lib/hooks/useAds'
import { mockExposurePlans, mockPremiumProducts } from '@/lib/mock/data'
import { CARD, won } from '@/lib/dashboard-ui'
import { AlertTriangle } from 'lucide-react'

export default function AdsPage() {
  const { ads } = useAds()
  const [plans, setPlans] = useState(mockExposurePlans)

  return (
    <div className="space-y-4">
      <div className={CARD}>
        <p className="text-[12px] text-gray-400 font-medium mb-3">현재 노출 현황</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">이번달 노출</p>
            <p className="text-lg font-semibold mt-1">{ads.monthly_exposure.toLocaleString()}회</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">클릭</p>
            <p className="text-lg font-semibold mt-1">{ads.clicks.toLocaleString()}회</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">예약 전환</p>
            <p className="text-lg font-semibold mt-1">{ads.booking_conversions}건</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">노출 범위</p>
            <p className="text-lg font-semibold mt-1">반경 {ads.radius_km}km</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">전환율</p>
            <p className="text-lg font-semibold mt-1">{ads.conversion_rate}%</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[12px] text-gray-400">앱 노출 유지비</p>
            <p className="text-lg font-semibold mt-1">{won(ads.app_maintenance_fee)}/월</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[12px] text-gray-400 font-medium mb-2">노출 범위 확장</p>
        <div className="space-y-2">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`${CARD} flex items-center gap-3 cursor-pointer ${
                plan.selected ? 'border-blue-300 bg-blue-50/50' : ''
              }`}
            >
              <input
                type="radio"
                name="exposure"
                checked={plan.selected}
                onChange={() => setPlans((prev) => prev.map((p) => ({ ...p, selected: p.id === plan.id })))}
                className="text-blue-600"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{plan.label}</p>
                <p className="text-xs text-gray-400">{plan.radius}</p>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {plan.extra_fee === 0 ? '기본 포함' : `+${plan.extra_fee.toLocaleString()}원`}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[12px] text-gray-400 font-medium mb-2">프리미엄 광고 상품</p>
        <div className="grid grid-cols-2 gap-3">
          {mockPremiumProducts.map((p) => (
            <div key={p.id} className={CARD}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                {p.badge && <Badge className="bg-orange-100 text-orange-700 shrink-0">{p.badge}</Badge>}
              </div>
              <p className="text-xs text-gray-400 mb-3">{p.desc}</p>
              <p className="text-sm font-semibold text-blue-600">{won(p.price)}</p>
              <button type="button" className="mt-3 w-full text-xs py-2 rounded-xl border border-blue-200 text-blue-600 bg-blue-50 font-medium">
                신청하기
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2 text-sm text-amber-800">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <p>월 {ads.app_maintenance_fee.toLocaleString()}원 미납 시 모든 노출이 일시 중지됩니다.</p>
      </div>
    </div>
  )
}
