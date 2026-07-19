'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AutomationSettingCard from '@/components/ads/AutomationSettingCard'
import MetricCard from '@/components/ads/MetricCard'
import { fetchBusinessAdProducts } from '@/lib/ad-applications/business-api'
import {
  fetchRevisitReminderSettings,
  saveRevisitReminderSettings,
  type RevisitReminderSettings,
} from '@/lib/revisit-reminder-api'
import { fetchBusinessMe } from '@/lib/store-api'

const FALLBACK_DAYS = [14, 30, 60, 90] as const

export default function RevisitReminderSettingsPage() {
  const [businessName, setBusinessName] = useState('우리 매장')
  const [enabled, setEnabled] = useState(false)
  const [intervalDays, setIntervalDays] = useState(30)
  const [allowedDays, setAllowedDays] = useState<number[]>([...FALLBACK_DAYS])
  const [preview, setPreview] = useState<string | null>(null)
  const [lastRunAt, setLastRunAt] = useState<string | null>(null)
  const [sentTotal, setSentTotal] = useState(0)
  const [failedTotal, setFailedTotal] = useState(0)
  const [savedSnapshot, setSavedSnapshot] = useState({ enabled: false, intervalDays: 30 })
  const [automationAllowed, setAutomationAllowed] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const dirty =
    enabled !== savedSnapshot.enabled || intervalDays !== savedSnapshot.intervalDays

  const applySettings = useCallback((settings: RevisitReminderSettings) => {
    setEnabled(settings.enabled)
    setIntervalDays(settings.interval_days)
    setAllowedDays(
      settings.allowed_interval_days?.length
        ? settings.allowed_interval_days
        : [...FALLBACK_DAYS],
    )
    setPreview(settings.preview_message)
    setLastRunAt(settings.last_run_at)
    setSentTotal(settings.sent_total)
    setFailedTotal(settings.failed_total)
    setSavedSnapshot({
      enabled: settings.enabled,
      intervalDays: settings.interval_days,
    })
  }, [])

  const load = useCallback(async () => {
    try {
      const [me, settings, catalog] = await Promise.all([
        fetchBusinessMe(),
        fetchRevisitReminderSettings(),
        fetchBusinessAdProducts().catch(() => null),
      ])
      setBusinessName(me.name)
      setAutomationAllowed(catalog?.can_use_automation ?? null)
      applySettings(settings)
    } catch {
      setError('설정을 불러오지 못했습니다.')
    }
  }, [applySettings])

  useEffect(() => {
    void load()
  }, [load])

  const livePreview = useMemo(() => {
    if (preview && intervalDays === savedSnapshot.intervalDays) return preview
    return `${businessName}에 방문하신 지 ${intervalDays}일이 지났습니다. 차량 관리가 필요할 때 다시 찾아주세요.`
  }, [businessName, intervalDays, preview, savedSnapshot.intervalDays])

  const handleSave = async () => {
    if (automationAllowed === false) {
      setSaveError('재방문 알림 자동화는 Standard 플랜부터 사용할 수 있습니다.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const saved = await saveRevisitReminderSettings({
        enabled,
        interval_days: intervalDays,
        include_coupon: false,
        use_default_message: true,
        custom_message: null,
      })
      applySettings(saved)
      setToast('재방문 알림 설정이 저장되었습니다.')
      setTimeout(() => setToast(null), 2500)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const locked = automationAllowed === false

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold text-gray-900">재방문 알림 설정</h1>
        <Link href="/dashboard/ads" className="ml-auto text-sm text-blue-600 hover:underline">
          ← 앱 노출 관리
        </Link>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {locked ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          재방문 알림 자동화는 Standard 플랜부터 사용할 수 있습니다.{' '}
          <Link href="/dashboard/billing" className="font-medium text-blue-600 underline">
            플랜 업그레이드
          </Link>
        </div>
      ) : null}
      {toast ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="최근 실행"
          value={lastRunAt ? lastRunAt.slice(0, 10) : '기록 없음'}
        />
        <MetricCard label="누적 발송" value={`${sentTotal}건`} />
        <MetricCard label="누적 실패" value={`${failedTotal}건`} />
      </div>

      <AutomationSettingCard
        title="자동화 활성화"
        description="마지막 방문 후 설정한 기간이 지나면 고객앱 Push로 안내합니다."
      >
        <label className="flex items-center gap-3 text-sm text-gray-800">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={enabled}
            disabled={locked}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          재방문 알림 사용
        </label>
      </AutomationSettingCard>

      <AutomationSettingCard
        title="발송 기준 일수"
        description="마지막 완료 방문 이후 경과 일수"
      >
        <div className="flex flex-wrap gap-2">
          {allowedDays.map((days) => (
            <button
              key={days}
              type="button"
              disabled={locked}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                intervalDays === days
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600'
              } disabled:opacity-50`}
              onClick={() => setIntervalDays(days)}
            >
              {days}일
            </button>
          ))}
        </div>
      </AutomationSettingCard>

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-gray-800">
        <p className="mb-1 text-xs font-medium text-blue-700">메시지 미리보기</p>
        <p className="leading-relaxed">{livePreview}</p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={locked || !dirty || saving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? '저장 중…' : '설정 저장'}
        </button>
      </div>
      {saveError ? <p className="text-right text-sm text-red-600">{saveError}</p> : null}
    </div>
  )
}
