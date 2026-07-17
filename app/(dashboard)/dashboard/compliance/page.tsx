'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  fetchBusinessCompliance,
  fetchOwnerDocumentDownloadUrl,
  patchBusinessComplianceProfile,
  resubmitBusinessCompliance,
  submitBusinessCompliance,
  uploadBusinessComplianceDocument,
  type ComplianceStatus,
} from '@/lib/compliance-api'

export default function BusinessCompliancePage() {
  const [data, setData] = useState<ComplianceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [agree, setAgree] = useState({ terms: false, privacy: false, settlement: false })
  const [form, setForm] = useState({
    businessEntityType: 'SOLE_PROPRIETOR',
    legalBusinessName: '',
    representativeName: '',
    businessRegistrationNumber: '',
    settlementBankCode: '',
    settlementAccountNumber: '',
    settlementAccountHolder: '',
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchBusinessCompliance()
      setData(res)
      setForm((f) => ({
        ...f,
        businessEntityType: res.businessEntityType || 'SOLE_PROPRIETOR',
        legalBusinessName: res.legalBusinessName || '',
        representativeName: res.representativeName || '',
        businessRegistrationNumber: res.businessRegistrationNumber || '',
        settlementBankCode: res.settlementBankCode || '',
        settlementAccountHolder: res.settlementAccountHolder || '',
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        businessEntityType: form.businessEntityType,
        legalBusinessName: form.legalBusinessName,
        representativeName: form.representativeName,
        businessRegistrationNumber: form.businessRegistrationNumber,
        settlementBankCode: form.settlementBankCode,
        settlementAccountHolder: form.settlementAccountHolder,
      }
      if (form.settlementAccountNumber.trim()) {
        body.settlementAccountNumber = form.settlementAccountNumber.trim()
      }
      const res = await patchBusinessComplianceProfile(body)
      setData(res)
      setForm((f) => ({ ...f, settlementAccountNumber: '' }))
      showToast('사업자·정산 정보가 저장되었습니다.')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const onUpload = async (code: string, file: File, requiresExp: boolean) => {
    let expirationDate: string | undefined
    if (requiresExp) {
      const v = window.prompt('만료일 (YYYY-MM-DD)')
      if (!v) return
      expirationDate = v
    }
    setSaving(true)
    try {
      await uploadBusinessComplianceDocument({ documentTypeCode: code, file, expirationDate })
      await load()
      showToast('서류가 업로드되었습니다.')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '업로드 실패')
    } finally {
      setSaving(false)
    }
  }

  const onSubmit = async () => {
    setSaving(true)
    try {
      const fn =
        data?.onboardingStatus === 'NEEDS_REVISION'
          ? resubmitBusinessCompliance
          : submitBusinessCompliance
      const res = await fn({
        agreeTerms: agree.terms,
        agreePrivacy: agree.privacy,
        agreeSettlement: agree.settlement,
      })
      setData(res)
      showToast('심사가 제출되었습니다.')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '제출 실패')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="p-6 text-sm text-stone-400">불러오는 중...</p>
  if (error || !data) return <p className="p-6 text-sm text-red-600">{error || '오류'}</p>

  const locked = data.onboardingStatus === 'SUBMITTED' || data.onboardingStatus === 'APPROVED'

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          {toast}
        </div>
      )}
      <div>
        <h1 className="text-xl font-semibold text-stone-900">사업자·정산 서류</h1>
        <p className="mt-1 text-sm text-stone-500">
          입점심사·계약·정산·PG 준비 서류를 제출합니다. 민감 서류는 비공개로 저장됩니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['입점심사', data.onboardingStatus],
          ['계약', data.contractStatus],
          ['정산계좌', data.settlementVerificationStatus],
          ['PG 준비', data.pgReadinessStatus],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-3">
            <p className="text-[11px] text-stone-400">{label}</p>
            <p className="mt-1 text-sm font-medium text-stone-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">완료율</p>
          <p className="text-sm font-semibold text-indigo-600">{data.completionRate}%</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full bg-indigo-500" style={{ width: `${data.completionRate}%` }} />
        </div>
        {data.rejectionReason && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            반려/수정 요청: {data.rejectionReason}
          </p>
        )}
      </div>

      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold">사업자·정산 정보</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            disabled={locked}
            value={form.businessEntityType}
            onChange={(e) => setForm({ ...form, businessEntityType: e.target.value })}
          >
            <option value="SOLE_PROPRIETOR">개인사업자</option>
            <option value="CORPORATION">법인사업자</option>
          </select>
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="상호"
            disabled={locked}
            value={form.legalBusinessName}
            onChange={(e) => setForm({ ...form, legalBusinessName: e.target.value })}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="대표자명"
            disabled={locked}
            value={form.representativeName}
            onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="사업자등록번호"
            disabled={locked}
            value={form.businessRegistrationNumber}
            onChange={(e) => setForm({ ...form, businessRegistrationNumber: e.target.value })}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="은행코드"
            disabled={locked}
            value={form.settlementBankCode}
            onChange={(e) => setForm({ ...form, settlementBankCode: e.target.value })}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="예금주"
            disabled={locked}
            value={form.settlementAccountHolder}
            onChange={(e) => setForm({ ...form, settlementAccountHolder: e.target.value })}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
            placeholder={
              data.settlementAccountNumberMasked
                ? `계좌번호 (등록됨: ${data.settlementAccountNumberMasked})`
                : '계좌번호'
            }
            disabled={locked}
            value={form.settlementAccountNumber}
            onChange={(e) => setForm({ ...form, settlementAccountNumber: e.target.value })}
          />
        </div>
        {!locked && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveProfile()}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            정보 저장
          </button>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold">서류 체크리스트</h2>
        <div className="space-y-2">
          {[...data.checklist]
            .sort((a, b) => {
              const rank = (s: string) => (s === 'REJECTED' ? 0 : s === 'MISSING' ? 1 : 2)
              return rank(a.effectiveStatus) - rank(b.effectiveStatus)
            })
            .map((item) => (
              <div
                key={item.code}
                className="flex flex-col gap-2 rounded-lg border border-stone-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    {item.name}{' '}
                    {item.isRequired && <span className="text-xs text-red-500">필수</span>}
                  </p>
                  <p className="text-xs text-stone-400">
                    {item.effectiveStatus}
                    {item.document?.rejectionReason ? ` · ${item.document.rejectionReason}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.document && (
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() =>
                        void fetchOwnerDocumentDownloadUrl(item.document!.id).then((r) =>
                          window.open(r.url, '_blank', 'noopener,noreferrer'),
                        )
                      }
                    >
                      열람
                    </button>
                  )}
                  {!locked && (
                    <label className="cursor-pointer rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                      업로드
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) void onUpload(item.code, f, item.requiresExpirationDate)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}
        </div>
      </section>

      {!locked && (
        <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-semibold">심사 제출</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={agree.terms}
              onChange={(e) => setAgree({ ...agree, terms: e.target.checked })}
            />
            서비스 이용약관 동의
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={agree.privacy}
              onChange={(e) => setAgree({ ...agree, privacy: e.target.checked })}
            />
            개인정보 수집·이용 동의
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={agree.settlement}
              onChange={(e) => setAgree({ ...agree, settlement: e.target.checked })}
            />
            정산 동의
          </label>
          <button
            type="button"
            disabled={saving || !data.canSubmit}
            onClick={() => void onSubmit()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            {data.onboardingStatus === 'NEEDS_REVISION' ? '재제출' : '심사 제출'}
          </button>
          {!data.canSubmit && (
            <p className="text-xs text-stone-400">
              필수 서류·사업자·계좌 정보를 완료해야 제출할 수 있습니다. (미제출{' '}
              {data.missingRequiredCount} / 반려 {data.rejectedCount})
            </p>
          )}
        </section>
      )}
    </div>
  )
}
