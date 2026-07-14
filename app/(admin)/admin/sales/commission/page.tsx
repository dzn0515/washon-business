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

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

function toNum(v: number | string | undefined | null): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : Number(v)
}

function localPlanExamples(
  rateMonth1: number,
  rateMonth2: number,
  rateMonth3To12: number,
  agentW: number,
  agencyW: number,
  distW: number,
  durationMonths: number,
): AdminSalesPlanExample[] {
  const fees = [
    { planTier: 'BASIC', monthlyFee: 28000 },
    { planTier: 'STANDARD', monthlyFee: 59000 },
    { planTier: 'PREMIUM', monthlyFee: 99000 },
  ]
  const weightSum = agentW + agencyW + distW || 1
  const split = (tier: number, fee: number) => {
    const agent = Math.round((fee * tier * agentW) / weightSum / 100)
    const agency = Math.round((fee * tier * agencyW) / weightSum / 100)
    const distributor = Math.round((fee * tier * distW) / weightSum / 100)
    return { agent, agency, distributor, total: agent + agency + distributor }
  }
  return fees.map(({ planTier, monthlyFee }) => {
    let annual = 0
    const monthExamples = [1, 2, 3, 12].map((monthIndex) => {
      const tier =
        monthIndex === 1 ? rateMonth1 : monthIndex === 2 ? rateMonth2 : rateMonth3To12
      const s = split(tier, monthlyFee)
      return {
        monthIndex,
        tierRate: tier,
        agentCommission: s.agent,
        agencyCommission: s.agency,
        distributorCommission: s.distributor,
        totalCommission: s.total,
      }
    })
    for (let m = 1; m <= durationMonths; m++) {
      const tier = m === 1 ? rateMonth1 : m === 2 ? rateMonth2 : rateMonth3To12
      annual += split(tier, monthlyFee).total
    }
    const steady = split(rateMonth3To12, monthlyFee)
    return {
      planTier,
      monthlyFee,
      agentCommission: steady.agent,
      agencyCommission: steady.agency,
      distributorCommission: steady.distributor,
      totalCommission: steady.total,
      annualTotal: annual,
      monthExamples,
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
    rateMonth1: '50',
    rateMonth2: '30',
    rateMonth3To12: '15',
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
        rateMonth1: String(toNum(p.rateMonth1) || 50),
        rateMonth2: String(toNum(p.rateMonth2) || 30),
        rateMonth3To12: String(toNum(p.rateMonth3To12) || 15),
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

  const rateMonth1 = Number(form.rateMonth1) || 0
  const rateMonth2 = Number(form.rateMonth2) || 0
  const rateMonth3To12 = Number(form.rateMonth3To12) || 0
  const agentRate = Number(form.agentRate) || 0
  const agencyRate = Number(form.agencyRate) || 0
  const distributorRate = Number(form.distributorRate) || 0
  const durationMonths = Number(form.durationMonths) || 12

  const planExamples = useMemo(() => {
    if (
      preview?.planExamples?.length &&
      rateMonth1 === toNum(policy?.rateMonth1) &&
      rateMonth2 === toNum(policy?.rateMonth2) &&
      rateMonth3To12 === toNum(policy?.rateMonth3To12)
    ) {
      return preview.planExamples
    }
    return localPlanExamples(
      rateMonth1,
      rateMonth2,
      rateMonth3To12,
      agentRate,
      agencyRate,
      distributorRate,
      durationMonths,
    )
  }, [
    preview,
    policy,
    rateMonth1,
    rateMonth2,
    rateMonth3To12,
    agentRate,
    agencyRate,
    distributorRate,
    durationMonths,
  ])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateAdminSalesCommissionPolicy({
        name: form.name.trim() || undefined,
        agentRate,
        agencyRate,
        distributorRate,
        rateMonth1,
        rateMonth2,
        rateMonth3To12,
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
        description="유료 개월차별 수수료 (구독료 VAT 제외 기준, 무료체험 제외)"
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
            <AdminStatCard icon="1️⃣" label="1개월차" value={`${rateMonth1}%`} color="blue" />
            <AdminStatCard icon="2️⃣" label="2개월차" value={`${rateMonth2}%`} color="purple" />
            <AdminStatCard
              icon="📅"
              label="3~12개월차"
              value={`${rateMonth3To12}%`}
              color="green"
            />
            <AdminStatCard icon="⏹" label="13개월~" value="0%" color="orange" />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-gray-900">정책 수정</h2>
              <span className="text-xs text-gray-500">
                첫 유료결제 = 1개월차 · 미납 지급 없음 · 환불은 다음 정산 차감
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <label className="space-y-1 lg:col-span-2">
                <span className="text-gray-600">정책명</span>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-gray-600">1개월차 %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.rateMonth1}
                  onChange={(e) => setForm((f) => ({ ...f, rateMonth1: e.target.value }))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-gray-600">2개월차 %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.rateMonth2}
                  onChange={(e) => setForm((f) => ({ ...f, rateMonth2: e.target.value }))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-gray-600">3~12개월차 %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.rateMonth3To12}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rateMonth3To12: e.target.value }))
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
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-sm text-gray-700 font-medium">내부 배분</p>
              <p className="text-xs text-gray-500">
                본사 정책은 유료 개월차별 <strong>총 수수료 풀</strong>만 관리합니다. 총판·영업점·영업사원
                배분율(합계 100%)은{' '}
                <a href="/admin/sales/distributors" className="text-blue-600 underline">
                  총판 관리
                </a>
                에서 총판별로 설정합니다. 아래 값은 배분 정책이 없을 때 쓰는 기본 비중(레거시)입니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <label className="space-y-1">
                  <span className="text-gray-600">영업사원 기본 비중</span>
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
                  <span className="text-gray-600">영업점 기본 비중</span>
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
                  <span className="text-gray-600">총판 기본 비중</span>
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
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">요금제·개월차 예시 (VAT 제외)</h2>
            <p className="text-sm text-gray-500">
              BASIC 28,000원 기준 · 1개월차 {rateMonth1}% / 2개월차 {rateMonth2}% / 3~12개월차{' '}
              {rateMonth3To12}%
            </p>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <AdminTable
                loading={false}
                columns={[
                  { key: 'plan', label: '요금제' },
                  { key: 'fee', label: '월 구독료', width: '110px' },
                  { key: 'm1', label: '1개월차', width: '100px' },
                  { key: 'm2', label: '2개월차', width: '100px' },
                  { key: 'm3', label: '3~12개월', width: '100px' },
                  { key: 'annual', label: `${durationMonths}개월 합`, width: '110px' },
                ]}
                data={planExamples.map((ex) => {
                  const m = ex.monthExamples ?? []
                  const m1 = m.find((x) => x.monthIndex === 1)
                  const m2 = m.find((x) => x.monthIndex === 2)
                  const m3 = m.find((x) => x.monthIndex === 3)
                  return {
                    plan: <span className="font-medium">{ex.planTier}</span>,
                    fee: formatMoney(ex.monthlyFee ?? ex.baseAmount ?? 0),
                    m1: formatMoney(m1?.totalCommission ?? 0),
                    m2: formatMoney(m2?.totalCommission ?? 0),
                    m3: formatMoney(m3?.totalCommission ?? ex.totalCommission),
                    annual: formatMoney(ex.annualTotal),
                  }
                })}
                emptyMessage="예시가 없습니다."
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">업체별 예상 수수료</h2>
            <p className="text-xs text-gray-500 mt-1">
              유료 결제 개월수 기준 예상(estimated)입니다.
            </p>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <AdminTable
                loading={loading}
                columns={[
                  { key: 'partner', label: '업체' },
                  { key: 'agent', label: '영업사원' },
                  { key: 'month', label: '유료 개월차', width: '110px' },
                  { key: 'rate', label: '적용 요율', width: '90px' },
                  { key: 'total', label: '이번달', width: '100px' },
                  { key: 'next', label: '다음달 예상', width: '100px' },
                  { key: 'remain', label: '남은 개월', width: '80px' },
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
                  month:
                    row.commissionMonth > 0 ? `유료 ${row.commissionMonth}개월차` : '체험중',
                  rate:
                    row.appliedTierRate != null ? `${toNum(row.appliedTierRate)}%` : '-',
                  total: formatMoney(row.totalCommission),
                  next: formatMoney(row.nextMonthAgentCommission ?? 0),
                  remain: String(row.remainingMonths),
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
          1개월차 {rateMonth1}% · 2개월차 {rateMonth2}% · 3~12개월차 {rateMonth3To12}% ·{' '}
          {durationMonths}개월 정책을 저장할까요?
        </p>
        <p className="text-xs text-gray-500 mt-2">모든 금액은 구독료 VAT 제외 기준입니다.</p>
      </AdminModal>
    </div>
  )
}
