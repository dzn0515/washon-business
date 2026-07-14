'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AutomationSettingCard from '@/components/ads/AutomationSettingCard'
import { BTN_PRIMARY } from '@/lib/dashboard-ui'
import {
  fetchReviewRewardSettings,
  fetchReviewRewardTemplates,
  saveReviewRewardSettings,
  type ReviewRewardSettings,
  type ReviewRewardTemplate,
} from '@/lib/review-reward-api'

function formatDiscount(t: ReviewRewardTemplate): string {
  if (t.discountType === 'percent') return `${t.discountValue}%`
  return `${t.discountValue.toLocaleString()}원`
}

export default function ReviewRewardSettingsPage() {
  const [settings, setSettings] = useState<ReviewRewardSettings | null>(null)
  const [templates, setTemplates] = useState<ReviewRewardTemplate[]>([])
  const [enabled, setEnabled] = useState(false)
  const [templateId, setTemplateId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, t] = await Promise.all([
        fetchReviewRewardSettings(),
        fetchReviewRewardTemplates(),
      ])
      setSettings(s)
      setEnabled(Boolean(s.enabled))
      setTemplateId(s.couponTemplateId != null ? String(s.couponTemplateId) : '')
      setTemplates(t.items ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '설정을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(id)
  }, [toast])

  const dirty = useMemo(() => {
    if (!settings) return false
    const savedId = settings.couponTemplateId != null ? String(settings.couponTemplateId) : ''
    return enabled !== Boolean(settings.enabled) || templateId !== savedId
  }, [settings, enabled, templateId])

  const validationError = useMemo(() => {
    if (enabled && !templateId) return '사용 시 쿠폰 템플릿을 선택해 주세요'
    return null
  }, [enabled, templateId])

  async function handleSave() {
    if (validationError) {
      setSaveError(validationError)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const saved = await saveReviewRewardSettings({
        enabled,
        couponTemplateId: enabled && templateId ? Number(templateId) : null,
      })
      setSettings(saved)
      setEnabled(Boolean(saved.enabled))
      setTemplateId(saved.couponTemplateId != null ? String(saved.couponTemplateId) : '')
      setToast('저장되었습니다')
      const t = await fetchReviewRewardTemplates()
      setTemplates(t.items ?? [])
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">불러오는 중…</div>
  }

  if (error) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-red-600">{error}</p>
        <button type="button" className={BTN_PRIMARY} onClick={() => void load()}>
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6 pb-24">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">리뷰 마케팅</h1>
        <p className="mt-1 text-sm text-gray-500">
          고객이 리뷰를 남기면 매장 쿠폰을 자동 발급합니다. AUTOON은 검증·발급·알림만 담당하며,
          포인트는 지급하지 않습니다.
        </p>
      </div>

      {toast ? (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{toast}</div>
      ) : null}

      <AutomationSettingCard
        title="사용"
        description="OFF면 리뷰 작성 시 쿠폰을 발급하지 않습니다"
      >
        <div className="flex gap-2">
          {([false, true] as const).map((on) => (
            <button
              key={String(on)}
              type="button"
              onClick={() => setEnabled(on)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                enabled === on
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {on ? 'ON' : 'OFF'}
            </button>
          ))}
        </div>
      </AutomationSettingCard>

      <AutomationSettingCard
        title="쿠폰 선택"
        description="템플릿만 표시됩니다 (미발급 · 활성 · 기간 유효)"
        error={enabled ? validationError : null}
      >
        {templates.length === 0 ? (
          <p className="text-sm text-gray-500">
            선택 가능한 쿠폰 템플릿이 없습니다. 쿠폰 관리에서 템플릿을 먼저 만들어 주세요.
          </p>
        ) : (
          <select
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={templateId}
            disabled={!enabled}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">쿠폰을 선택하세요</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {formatDiscount(t)}
              </option>
            ))}
          </select>
        )}
        {settings?.couponTemplateName && enabled && templateId ? (
          <p className="mt-2 text-xs text-gray-400">현재: {settings.couponTemplateName}</p>
        ) : null}
      </AutomationSettingCard>

      {dirty ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          저장되지 않은 변경사항이 있습니다
        </div>
      ) : null}

      {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white/95 px-6 py-3 md:static md:border-0 md:bg-transparent md:p-0">
        <button
          type="button"
          className={`${BTN_PRIMARY} disabled:opacity-50`}
          disabled={saving || !dirty || Boolean(validationError)}
          onClick={() => void handleSave()}
        >
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  )
}
