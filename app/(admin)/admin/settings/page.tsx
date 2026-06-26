'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { mockSystemSettings, mockSystemStatus } from '@/lib/mock/admin-data'
import { formatMoney } from '@/lib/utils'

const STATUS_DOT = {
  ok: '🟢',
  warn: '🟡',
  error: '🔴',
} as const

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(mockSystemSettings)
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const updateNum = (key: keyof typeof settings, value: number) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  const updateAdPrice = (key: keyof typeof settings.adPrices, value: number) => {
    setSettings((s) => ({
      ...s,
      adPrices: { ...s.adPrices, [key]: value },
    }))
  }

  return (
    <div className="space-y-6">
      <Card title="서비스 설정">
        <div className="space-y-4">
          <SettingRow
            label="앱 노출 유지비"
            suffix="원/월"
            value={settings.maintenanceFee}
            onChange={(v) => updateNum('maintenanceFee', v)}
          />
          <SettingRow
            label="무료 체험 기간"
            suffix="일"
            value={settings.freeTrialDays}
            onChange={(v) => updateNum('freeTrialDays', v)}
          />
          <SettingRow
            label="예약 수수료율"
            suffix="%"
            value={settings.bookingFeeRate}
            onChange={(v) => updateNum('bookingFeeRate', v)}
            hint="Phase 3 예정"
          />
          <SettingRow
            label="노쇼 예약금 (기본값)"
            suffix="원"
            value={settings.noShowDeposit}
            onChange={(v) => updateNum('noShowDeposit', v)}
          />
          <Button className="bg-[#1A6DFF]" onClick={save}>
            저장하기
          </Button>
          {saved && <p className="text-sm text-green-600">설정이 저장됐습니다. (mock)</p>}
        </div>
      </Card>

      <Card title="광고 상품 가격">
        <div className="space-y-4">
          <SettingRow
            label="검색 상단 고정"
            suffix="원/월"
            value={settings.adPrices.searchTop}
            onChange={(v) => updateAdPrice('searchTop', v)}
          />
          <SettingRow
            label="홈 추천 매장"
            suffix="원/월"
            value={settings.adPrices.homeFeatured}
            onChange={(v) => updateAdPrice('homeFeatured', v)}
          />
          <SettingRow
            label="신규 부스팅"
            suffix="원/월"
            value={settings.adPrices.newBoost}
            onChange={(v) => updateAdPrice('newBoost', v)}
          />
          <SettingRow
            label="브랜드 키워드"
            suffix="원/월"
            value={settings.adPrices.brandKeyword}
            onChange={(v) => updateAdPrice('brandKeyword', v)}
          />
          <p className="text-xs text-gray-400">
            기본 노출 앱 노출 유지비: {formatMoney(settings.maintenanceFee)}/월
          </p>
        </div>
      </Card>

      <Card title="시스템 상태">
        <div className="grid sm:grid-cols-2 gap-3">
          {mockSystemStatus.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm"
            >
              <span className="text-gray-700 font-medium">{s.name}</span>
              <span className="text-gray-600">
                {STATUS_DOT[s.status]} {s.detail}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SettingRow({
  label,
  suffix,
  value,
  onChange,
  hint,
}: {
  label: string
  suffix: string
  value: number
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="sm:w-40 shrink-0">
        <span className="text-sm text-gray-700">{label}</span>
        {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
      </div>
      <div className="flex items-center gap-2 flex-1">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="max-w-[160px]"
        />
        <span className="text-sm text-gray-500">{suffix}</span>
      </div>
    </div>
  )
}
