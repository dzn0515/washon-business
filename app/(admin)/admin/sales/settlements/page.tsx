'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import SalesSubNav from '@/components/admin/SalesSubNav'
import {
  createAdminSalesSettlement,
  fetchAdminSalesSettlementMetrics,
  fetchAdminSalesSettlementPreview,
  fetchAdminSalesSettlements,
  type AdminSettlementBatch,
  type AdminSettlementMetrics,
  type AdminSettlementPreview,
} from '@/lib/admin-api'

const PAGE_SIZE = 20

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '초안',
  CALCULATED: '산출됨',
  CONFIRMED: '확정',
  PAYMENT_PENDING: '지급대기',
  PAID: '지급완료',
  CANCELLED: '취소',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error' | 'info'> = {
  DRAFT: 'neutral',
  CALCULATED: 'info',
  CONFIRMED: 'success',
  PAYMENT_PENDING: 'warning',
  PAID: 'success',
  CANCELLED: 'error',
}

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('ko-KR')
}

function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function AdminSalesSettlementsPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<AdminSettlementMetrics | null>(null)
  const [items, setItems] = useState<AdminSettlementBatch[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createMonth, setCreateMonth] = useState(currentMonthValue())
  const [createMemo, setCreateMemo] = useState('')
  const [preview, setPreview] = useState<AdminSettlementPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, list] = await Promise.all([
        fetchAdminSalesSettlementMetrics(),
        fetchAdminSalesSettlements({
          month: month || undefined,
          status,
          page,
          pageSize: PAGE_SIZE,
        }),
      ])
      setMetrics(m)
      setItems(list.items)
      setTotal(list.total)
      setTotalPages(list.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '정산 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [month, status, page])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setCreateMonth(currentMonthValue())
    setCreateMemo('')
    setPreview(null)
    setCreateOpen(true)
  }

  const runPreview = async () => {
    setPreviewLoading(true)
    setError(null)
    try {
      const p = await fetchAdminSalesSettlementPreview({ settlementMonth: createMonth })
      setPreview(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '미리보기에 실패했습니다.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleCreate = async () => {
    setSaving(true)
    setError(null)
    try {
      const created = await createAdminSalesSettlement({
        settlementMonth: createMonth,
        memo: createMemo.trim() || null,
      })
      setCreateOpen(false)
      router.push(`/admin/sales/settlements/${created.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '정산 배치 생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="정산 관리"
        description="구독료 VAT 제외 실제 결제 기준 영업 수수료 정산"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              새로고침
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              정산 배치 생성
            </button>
          </div>
        }
      />

      <SalesSubNav />

      <p className="text-sm text-gray-500">
        실제 구독 결제 기록 수집 연동 전입니다. 원천 결제 기록이 있는 건만 확정 정산됩니다.
        정산 금액은 VAT 제외 실결제 기준이며, 예상 수수료(현재 기본 정책)와 합산하지 않습니다.
      </p>

      {error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg flex justify-between gap-3">
          <span>{error}</span>
          <button type="button" className="underline" onClick={() => void load()}>
            재시도
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          icon="💳"
          label="이번 달 실결제 (VAT 제외)"
          value={formatMoney(metrics?.currentMonthPaidSales ?? 0)}
          color="blue"
        />
        <AdminStatCard
          icon="📝"
          label="초안/산출"
          value={formatMoney(metrics?.draftAmount ?? 0)}
          color="purple"
        />
        <AdminStatCard
          icon="✅"
          label="확정"
          value={formatMoney(metrics?.confirmedAmount ?? 0)}
          color="green"
        />
        <AdminStatCard
          icon="⏳"
          label="지급대기"
          value={formatMoney(metrics?.paymentPendingAmount ?? 0)}
          color="orange"
        />
        <AdminStatCard
          icon="💰"
          label="지급완료"
          value={formatMoney(metrics?.paidAmount ?? 0)}
          color="green"
        />
        <AdminStatCard
          icon="🔒"
          label="보류"
          value={formatMoney(metrics?.heldAmount ?? 0)}
          color="orange"
        />
        <AdminStatCard
          icon="👤"
          label="미지급 수취인"
          value={String(metrics?.unpaidRecipientCount ?? 0)}
          color="blue"
        />
        <AdminStatCard icon="📄" label="기준" value="VAT 제외" color="blue" />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-gray-600">정산월</span>
          <input
            type="month"
            className="block border rounded-lg px-3 py-2"
            value={month}
            onChange={(e) => {
              setPage(1)
              setMonth(e.target.value)
            }}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-600">상태</span>
          <select
            className="block border rounded-lg px-3 py-2"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
          >
            <option value="all">전체</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {month ? (
          <button
            type="button"
            className="text-sm px-3 py-2 border rounded-lg text-gray-600"
            onClick={() => {
              setMonth('')
              setPage(1)
            }}
          >
            월 필터 해제
          </button>
        ) : null}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <AdminTable
          loading={loading}
          columns={[
            { key: 'month', label: '정산월', width: '100px' },
            { key: 'status', label: '상태', width: '110px' },
            { key: 'badge', label: '구분', width: '100px' },
            { key: 'payments', label: '결제', width: '90px' },
            { key: 'net', label: '순매출', width: '110px' },
            { key: 'commission', label: '지급대상', width: '110px' },
            { key: 'held', label: '보류', width: '100px' },
            { key: 'created', label: '생성', width: '140px' },
            { key: 'actions', label: '', width: '80px' },
          ]}
          data={items.map((row) => ({
            month: <span className="font-medium">{row.settlementMonth}</span>,
            status: (
              <AdminBadge
                label={STATUS_LABEL[row.status] ?? row.status}
                variant={STATUS_VARIANT[row.status] ?? 'neutral'}
              />
            ),
            badge: row.estimated ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                예상
              </span>
            ) : (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">
                확정 정산
              </span>
            ),
            payments: `${row.eligiblePaymentCount}/${row.sourcePaymentCount}`,
            net: formatMoney(row.totalNetSales),
            commission: formatMoney(row.totalPayableCommission),
            held: formatMoney(row.totalHeldCommission),
            created: formatDateTime(row.createdAt),
            actions: (
              <Link
                href={`/admin/sales/settlements/${row.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                상세
              </Link>
            ),
          }))}
          emptyMessage="실제 구독 결제 기록이 수집된 이후 정산 가능합니다."
        />
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            총 {total.toLocaleString('ko-KR')}건 · {page}/{totalPages}페이지
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </button>
          </div>
        </div>
      ) : null}

      <AdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="정산 배치 생성"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setCreateOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving || !createMonth}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
              onClick={() => void handleCreate()}
            >
              {saving ? '생성 중...' : '생성'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-sm">
          <p className="text-gray-600">
            VAT 제외 실제 결제 기준으로 월별 정산 배치를 만듭니다. 예상 수수료와는 별도입니다.
          </p>
          <label className="block space-y-1">
            <span className="text-gray-600">정산월</span>
            <input
              type="month"
              className="w-full border rounded-lg px-3 py-2"
              value={createMonth}
              onChange={(e) => {
                setCreateMonth(e.target.value)
                setPreview(null)
              }}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-gray-600">메모 (선택)</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={createMemo}
              onChange={(e) => setCreateMemo(e.target.value)}
              placeholder="내부용 메모"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={previewLoading || !createMonth}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
              onClick={() => void runPreview()}
            >
              {previewLoading ? '미리보기 중...' : '월 미리보기'}
            </button>
          </div>
          {preview ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900">{preview.settlementMonth} 미리보기</span>
                {!preview.estimated ? (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">
                    확정 정산
                  </span>
                ) : null}
              </div>
              {preview.message ? (
                <p className="text-gray-500">{preview.message}</p>
              ) : (
                <ul className="grid grid-cols-2 gap-2 text-gray-700">
                  <li>결제 {preview.sourcePaymentCount}건</li>
                  <li>대상 {preview.eligiblePaymentCount}건</li>
                  <li>제외 {preview.excludedPaymentCount}건</li>
                  <li>순매출 {formatMoney(preview.totalNetSales)}</li>
                  <li>영업사원 {formatMoney(preview.agentCommission)}</li>
                  <li>영업점 {formatMoney(preview.agencyCommission)}</li>
                  <li>총판 {formatMoney(preview.distributorCommission)}</li>
                  <li className="font-medium">합계 {formatMoney(preview.totalCommission)}</li>
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </AdminModal>
    </div>
  )
}
