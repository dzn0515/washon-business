'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminBadge from '@/components/admin/AdminBadge'
import { useToast } from '@/components/admin/AdminToast'
import { fetchPlatformSettings, savePlatformSettings } from '@/lib/admin-api'
import { roundCommissionRate } from '@/lib/admin-ui'
import type { PlatformSettings } from '@/types'

export default function AdminSettingsPage() {
  const { showToast, ToastComponent } = useToast()
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchPlatformSettings()
      setSettings(data)
    } catch {
      setError(true)
      setSettings(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!settings) return
    if (settings.commissionRate < 0) {
      showToast('수수료율은 0% 이상이어야 합니다.', 'error')
      return
    }
    if (settings.commissionRate > 10) {
      showToast('수수료율은 10% 이하이어야 합니다.', 'error')
      return
    }
    setSaving(true)
    try {
      await savePlatformSettings(settings)
      showToast('설정이 저장되었습니다.', 'success')
    } catch {
      showToast('설정 저장에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-400 py-12 text-center">불러오는 중...</div>
  }

  if (error || !settings) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-sm text-gray-500 mb-4">운영설정을 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="운영설정"
        description="플랫폼 기본 설정 및 플랜 가격 관리"
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        }
      />

      <Section title="플랫폼 기본">
        <Field label="플랫폼명">
          <input
            type="text"
            value={settings.platformName}
            onChange={(e) => setSettings((s) => s && { ...s, platformName: e.target.value })}
            className="w-full max-w-md border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <Field label="문의 이메일">
          <input
            type="email"
            value={settings.contactEmail}
            onChange={(e) => setSettings((s) => s && { ...s, contactEmail: e.target.value })}
            className="w-full max-w-md border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <Field label="점검 모드">
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) =>
                  setSettings((s) => s && { ...s, maintenanceMode: e.target.checked })
                }
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700">점검 모드 활성화</span>
            </label>
            {settings.maintenanceMode && (
              <AdminBadge
                label="저장 시 UI에만 반영됩니다. 실제 서비스 차단은 별도 적용 필요"
                variant="warning"
              />
            )}
          </div>
        </Field>
      </Section>

      <Section title="수수료 설정">
        <Field label="예약 수수료율">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={settings.commissionRate}
              onChange={(e) => {
                const raw = parseFloat(e.target.value)
                const val = Number.isNaN(raw) ? 0 : roundCommissionRate(raw)
                setSettings((s) => s && { ...s, commissionRate: val })
              }}
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">% (0.0 ~ 10.0)</span>
          </div>
        </Field>
        <p className="text-sm text-gray-600">
          현재 수수료: <strong>{settings.commissionRate}%</strong>
        </p>
      </Section>

      <Section title="구독 플랜 가격">
        <p className="text-xs text-gray-400 mb-4">앱 노출 유지비 기준 플랜 가격</p>
        <PlanRow
          label="BASIC"
          value={settings.basicPlanPrice}
          onChange={(v) => setSettings((s) => s && { ...s, basicPlanPrice: v })}
        />
        <PlanRow
          label="PRO"
          value={settings.proPlanPrice}
          onChange={(v) => setSettings((s) => s && { ...s, proPlanPrice: v })}
        />
        <PlanRow
          label="PREMIUM"
          value={settings.premiumPlanPrice}
          onChange={(v) => setSettings((s) => s && { ...s, premiumPlanPrice: v })}
        />
        <Field label="무료체험">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={settings.freeTrialDays}
              onChange={(e) =>
                setSettings((s) => s && { ...s, freeTrialDays: Number(e.target.value) || 0 })
              }
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">일</span>
          </div>
        </Field>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[140px_1fr] gap-2 items-start">
      <span className="text-sm text-gray-600 pt-2">{label}</span>
      <div>{children}</div>
    </div>
  )
}

function PlanRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">{value.toLocaleString()}원 / 월</span>
      </div>
    </Field>
  )
}
