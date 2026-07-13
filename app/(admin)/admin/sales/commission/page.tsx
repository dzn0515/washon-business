'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import AdminModal from '@/components/admin/AdminModal'
import SalesSubNav from '@/components/admin/SalesSubNav'
import {
  fetchAdminSalesCommissionPolicy,
  fetchAdminSalesCommissionPreview,
  updateAdminSalesCommissionPolicy,
  type AdminSalesCommissionPolicy,
  type AdminSalesCommissionPreview,
  type AdminSalesPlanExample,
} from '@/lib/admin-api'

/** Fallback plan examples for default 10/3/2 (VAT 제외) when API preview is unavailable. */
const DEFAULT_PLAN_EXAMPLES: AdminSalesPlanExample[] = [
  {
    planTier: 'BASIC',
    monthlyFee: 28000,
    agentCommission: 2800,
    agencyCommission: 840,
    distributorCommission: 560,
    totalCommission: 4200,
    annualTotal: 50400,
  },
  {
    planTier: 'STANDARD',
    monthlyFee: 59000,
    agentCommission: 5900,
    agencyCommission: 1770,
    distributorCommission: 1180,
    totalCommission: 8850,
    annualTotal: 106200,
  },
  {
    planTier: 'PREMIUM',
    monthlyFee: 99000,
    agentCommission: 9900,
    agencyCommission: 2970,
    distributorCommission: 1980,
    totalCommission: 14850,
    annualTotal: 178200,
  },
]

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

function toNum(v: number | string | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : Number(v)
}

function localPlanExamples(
  agentRate: number,
  agencyRate: number,
  distributorRate: number,
  durationMonths: number,
): AdminSalesPlanExample[] {
  const fees = [
    { planTier: 'BASIC', monthlyFee: 28000 },
    { planTier: 'STANDARD', monthlyFee: 59000 },
    { planTier: 'PREMIUM', monthlyFee: 99000 },
  ]
  return fees.map(({ planTier, monthlyFee }) => {
    const agentCommission = Math.round((monthlyFee * agentRate) / 100)
    const agencyCommission = Math.round((monthlyFee * agencyRate) / 100)
    const distributorCommission = Math.round((monthlyFee * distributorRate) / 100)
    const totalCommission = agentCommission + agencyCommission + distributorCommission
    return {
      planTier,
      monthlyFee,
      agentCommission,
      agencyCommission,
      distributorCommission,
      totalCommission,
      annualTotal: totalCommission * durationMonths,
    }
  })
}

export default function AdminSalesCommissionPage() {
  const [policy, setPolicy] = useState<AdminSalesCommissionPolicy | null>(null)
  const [preview, setPreview] = useState<AdminSalesCommissionPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    agentRate: '10',
    agencyRate: '3',
    distributorRate: '2',
    durationMonths: '12',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, prev] = await Promise.all([
        fetchAdminSalesCommissionPolicy(),
        fetchAdminSalesCommissionPreview({ page: 1, pageSize: 50 }),
      ])
      setPolicy(p)
      setPreview(prev)
      setForm({
        name: p.name,
        agentRate: String(toNum(p.agentRate)),
        agencyRate: String(toNum(p.agencyRate)),
        distributorRate: String(toNum(p.distributorRate)),
        durationMonths: String(p.durationMonths),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '수수료 정책을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const agentRate = Number(form.agentRate) || 0
  const agencyRate = Number(form.agencyRate) || 0
  const distributorRate = Number(form.distributorRate) || 0
  const durationMonths = Number(form.durationMonths) || 12
  const totalRate = agentRate + agencyRate + distributorRate

  const planExamples = useMemo(() => {
    if (
      preview?.planExamples?.length &&
      agentRate === toNum(policy?.agentRate) &&
      agencyRate === toNum(policy?.agencyRate) &&
      distributorRate === toNum(policy?.distributorRate) &&
      durationMonths === (policy?.durationMonths ?? 12)
    ) {
      return preview.planExamples
    }
    if (
      agentRate === 10 &&
      agencyRate === 3 &&
      distributorRate === 2 &&
      durationMonths === 12 &&
      !policy
    ) {
      return DEFAULT_PLAN_EXAMPLES
    }
    return localPlanExamples(agentRate, agencyRate, distributorRate, durationMonths)
  }, [preview, policy, agentRate, agencyRate, distributorRate, durationMonths])

  const handleSave = async () => {
    if (totalRate > 15) {
      setError('합계 요율은 15%를 초과할 수 없습니다.')
      setConfirmOpen(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await updateAdminSalesCommissionPolicy({
        name: form.name.trim() || undefined,
        agentRate,
        agencyRate,
        distributorRate,
        durationMonths,
      })
      setPolicy(updated)
      setConfirmOpen(false)
      const prev = await fetchAdminSalesCommissionPreview({ page: 1, pageSize: 50 })
      setPreview(prev)
    } catch (e) {
      setError(e instanceof Error ? e.message : '정책 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="수수료 정책"
        description="구독료 VAT 제외 기준 영업 수수료 요율"
        actions={
          <button
            type="button"
            onClick={() => void load()}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
          >
            새로고침
          </button>
        }
      />

      <SalesSubNav />

      {error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg flex justify-between gap-3">
          <span>{error}</span>
          <button type="button" className="underline" onClick={() => void load()}>
            재시도
          </button>
        </div>
      ) : null}

      {loading && !policy ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard
              icon="💹"
              label="합계 요율"
              value={`${totalRate}%`}
              color={totalRate > 15 ? 'orange' : 'blue'}
            />
            <AdminStatCard
              icon="📅"
              label="지급 기간"
              value={`${durationMonths}개월`}
              color="green"
            />
            <AdminStatCard
              icon="💰"
              label="예상 월 총액"
              value={formatMoney(preview?.totalEstimatedMonthlyCommission ?? 0)}
              color="purple"
            />
            <AdminStatCard icon="📄" label="기준" value="VAT 제외" color="blue" />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-gray-900">정책 수정</h2>
              <span className="text-xs text-gray-500">
                기준: 구독료 VAT 제외 · 합계 ≤ 15%
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
              <label className="space-y-1 lg:col-span-2">
                <span className="text-gray-600">정책명</span>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-gray-600">영업사원 %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.agentRate}
                  onChange={(e) => setForm((f) => ({ ...f, agentRate: e.target.value }))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-gray-600">영업점 %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.agencyRate}
                  onChange={(e) => setForm((f) => ({ ...f, agencyRate: e.target.value }))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-gray-600">총판 %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.distributorRate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, distributorRate: e.target.value }))
                  }
                />
              </label>
              <label className="space-y-1">
                <span className="text-gray-600">지급 개월</span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.durationMonths}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationMonths: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-600">
                합계 <strong className={totalRate > 15 ? 'text-red-600' : ''}>{totalRate}%</strong>
                {totalRate > 15 ? ' (15% 초과 — 저장 불가)' : ''}
              </p>
              <button
                type="button"
                disabled={totalRate > 15}
                onClick={() => setConfirmOpen(true)}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
              >
                저장
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">요금제별 예시 (VAT 제외)</h2>
            <p className="text-sm text-gray-500">
              기본 10/3/2% 기준 BASIC 2,800 / 840 / 560 / 합계 4,200원
            </p>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <AdminTable
                loading={false}
                columns={[
                  { key: 'plan', label: '요금제' },
                  { key: 'fee', label: '월 구독료', width: '110px' },
                  { key: 'agent', label: '영업사원', width: '100px' },
                  { key: 'agency', label: '영업점', width: '100px' },
                  { key: 'dist', label: '총판', width: '100px' },
                  { key: 'total', label: '합계', width: '100px' },
                  { key: 'annual', label: `${durationMonths}개월`, width: '110px' },
                ]}
                data={planExamples.map((ex) => ({
                  plan: <span className="font-medium">{ex.planTier}</span>,
                  fee: formatMoney(ex.monthlyFee ?? ex.baseAmount ?? 0),
                  agent: formatMoney(ex.agentCommission),
                  agency: formatMoney(ex.agencyCommission),
                  dist: formatMoney(ex.distributorCommission),
                  total: <span className="font-medium">{formatMoney(ex.totalCommission)}</span>,
                  annual: formatMoney(ex.annualTotal),
                }))}
                emptyMessage="예시가 없습니다."
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">업체별 예상 수수료</h2>
            <p className="text-xs text-gray-500 mt-1">
              현재 기본 정책 기준 예상(estimated)이며, 확정 정산과 동일한 결과가 아닙니다.
            </p>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <AdminTable
                loading={loading}
                columns={[
                  { key: 'partner', label: '업체' },
                  { key: 'agent', label: '영업사원' },
                  { key: 'base', label: '기준액', width: '100px' },
                  { key: 'total', label: '합계', width: '100px' },
                  { key: 'month', label: '차월', width: '80px' },
                  { key: 'note', label: '비고' },
                ]}
                data={(preview?.items ?? []).map((row) => ({
                  partner: (
                    <div>
                      <p className="font-medium">{row.partnerName}</p>
                      <p className="text-xs text-gray-500">{row.planTier}</p>
                    </div>
                  ),
                  agent: (
                    <div className="text-sm">
                      <p>{row.salesAgentName || '-'}</p>
                      <p className="text-xs text-gray-500">
                        {[row.distributorName, row.agencyName].filter(Boolean).join(' / ') ||
                          ''}
                      </p>
                    </div>
                  ),
                  base: formatMoney(row.baseAmount),
                  total: formatMoney(row.totalCommission),
                  month: `${row.commissionMonth}/${row.remainingMonths}`,
                  note: <span className="text-xs text-gray-500">{row.note || '-'}</span>,
                }))}
                emptyMessage="배정된 업체가 없어 미리보기가 없습니다."
              />
            </div>
          </div>
        </>
      )}

      <AdminModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="수수료 정책 저장"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setConfirmOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
              onClick={() => void handleSave()}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          영업사원 {agentRate}% · 영업점 {agencyRate}% · 총판 {distributorRate}% (합계{' '}
          {totalRate}%) · {durationMonths}개월 정책을 저장할까요?
        </p>
        <p className="text-xs text-gray-500 mt-2">모든 금액은 구독료 VAT 제외 기준입니다.</p>
      </AdminModal>
    </div>
  )
}
