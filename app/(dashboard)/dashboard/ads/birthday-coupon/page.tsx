'use client'

import Link from 'next/link'
import StatusBadge from '@/components/ads/StatusBadge'

/** PART 2 STEP 3에서 상세 설정 UI로 교체 예정 */
export default function BirthdayCouponSettingsPlaceholderPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-gray-900">생일 쿠폰 설정</h1>
        <StatusBadge status="active" billingType="monthly" />
      </div>
      <p className="text-sm text-gray-600">
        할인 유형·유효기간·발급 내역 화면은 PART 2 승인 후 구현됩니다.
        자동화는 FCM 앱 푸시 전용입니다.
      </p>
      <Link
        href="/dashboard/ads"
        className="inline-block text-sm font-medium text-blue-600 hover:underline"
      >
        ← 앱 노출 관리로 돌아가기
      </Link>
    </div>
  )
}
