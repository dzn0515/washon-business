'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import SalesSubNav from '@/components/admin/SalesSubNav'
import {
  cancelAdminSubscriptionPayment,
  fetchAdminPaymentCollectionStatus,
  fetchAdminSubscriptionPayments,
  verifyAdminSubscriptionPayment,
  type AdminPaymentCollectionStatus,
  type AdminSubscriptionPaymentRecord,
} from '@/lib/admin-api'

const PAGE_SIZE = 20

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error' | 'info'> = {
  PAID: 'success',
  PARTIALLY_REFUNDED: 'warning',
  REFUNDED: 'error',
  CANCELLED: 'neutral',
  FAILED: 'error',
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

function toIsoLocal(value: string): string {
  // datetime-local → ISO; treat as local wall clock
  if (!value) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString()
}

export default function AdminSubscriptionPaymentsPage() {
  const [collection, setCollection] = useState<AdminPaymentCollectionStatus | null>(null)
  const [items, setItems] = useState<AdminSubscriptionPaymentRecord[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [verifyOpen, setVerifyOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [form, setForm] = useState({
    partnerId: '',
    subscriptionId: '',
    externalReference: '',
    paidAt: '',
    billingPeriodStart: '',
    billingPeriodEnd: '',
    netAmountExVat: '28000',
    vatAmount: '2800',
    grossAmount: '30800',
    paymentMethod: 'BANK_TRANSFER',
    memo: '',
  })

  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [col, list] = await Promise.all([
        fetchAdminPaymentCollectionStatus(),
        fetchAdminSubscriptionPayments({
          status,
          page,
          pageSize: PAGE_SIZE,
        }),
      ])
      setCollection(col)
      setItems(list.items)
      setTotal(list.total)
      setTotalPages(list.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '결제 원천 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => {
    void load()
  }, [load])

  const openVerify = () => {
    setConfirmChecked(false)
    setForm({
      partnerId: '',
      subscriptionId: '',
      externalReference: '',
      paidAt: '',
      billingPeriodStart: '',
      billingPeriodEnd: '',
      netAmountExVat: '28000',
      vatAmount: '2800',
      grossAmount: '30800',
      paymentMethod: 'BANK_TRANSFER',
      memo: '',
    })
    setVerifyOpen(true)
  }

  const syncGrossFromNet = (netStr: string) => {
    const net = Number(netStr)
    if (!Number.isFinite(net) || net <= 0) return
    const vat = Math.round(net * 0.1)
    setForm((f) => ({
      ...f,
      netAmountExVat: String(net),
      vatAmount: String(vat),
      grossAmount: String(net + vat),
    }))
  }

  const handleVerify = async () => {
    if (!confirmChecked) {
      setError('등록 전 경고 확인에 체크해야 합니다.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await verifyAdminSubscriptionPayment({
        partnerId: Number(form.partnerId),
        subscriptionId: Number(form.subscriptionId),
        externalReference: form.externalReference.trim(),
        paidAt: toIsoLocal(form.paidAt),
        billingPeriodStart: toIsoLocal(form.billingPeriodStart),
        billingPeriodEnd: toIsoLocal(form.billingPeriodEnd),
        grossAmount: Number(form.grossAmount),
        vatAmount: Number(form.vatAmount),
        netAmountExVat: Number(form.netAmountExVat),
        paymentMethod: form.paymentMethod || null,
        memo: form.memo.trim() || null,
        confirmWarning: true,
      })
      setVerifyOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '입금 확인 등록에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelId || !cancelReason.trim()) return
    setSaving(true)
    setError(null)
    try {
      await cancelAdminSubscriptionPayment(cancelId, cancelReason.trim())
      setCancelId(null)
      setCancelReason('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '취소에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="구독 입금 확인"
        description="회계·입금 확인 후 구독 결제 원천을 등록합니다"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/sales/settlements"
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              정산 관리
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              새로고침
            </button>
            <button
              type="button"
              onClick={openVerify}
              className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              입금 확인 등록
            </button>
          </div>
        }
      />

      <SalesSubNav />

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1">
        <p>
          결제 수집 방식:{' '}
          <span className="font-medium">
            {collection?.collectionModeLabel ?? '관리자 입금 확인'}
          </span>
          {collection?.pgLinked ? '' : ' · PG 미연동'}
        </p>
        <p>
          실제 입금·회계자료 확인 후에만 등록하세요. 등록 후 수정 불가입니다. 잘못 등록 시
          취소/조정이 필요합니다. VAT 제외 금액이 정산 기준입니다.
        </p>
        <p className="text-amber-700">
          최근 수집:{' '}
          {collection?.lastCollectedAt
            ? formatDateTime(collection.lastCollectedAt)
            : '없음'}{' '}
          · PAID/부분 {collection?.paidOrPartialCount ?? 0} · 환불{' '}
          {collection?.refundedCount ?? 0} · 전체 {collection?.totalRecords ?? 0}
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
      ) : null}

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value)
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
        >
          <option value="all">전체 상태</option>
          <option value="PAID">PAID</option>
          <option value="PARTIALLY_REFUNDED">부분환불</option>
          <option value="REFUNDED">환불</option>
          <option value="CANCELLED">취소</option>
        </select>
        <span className="text-sm text-gray-500">총 {total}건</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <AdminTable
          loading={loading}
          columns={[
            { key: 'id', label: 'ID', width: '70px' },
            { key: 'partner', label: 'Partner' },
            { key: 'paidAt', label: '결제일' },
            { key: 'net', label: 'VAT제외' },
            { key: 'gross', label: '총액' },
            { key: 'ref', label: '외부참조' },
            { key: 'source', label: '원천' },
            { key: 'status', label: '상태' },
            { key: 'actions', label: '' },
          ]}
          data={items.map((row) => ({
            id: row.id,
            partner: `${row.partnerId} / sub ${row.subscriptionId}`,
            paidAt: formatDateTime(row.paidAt),
            net: formatMoney(row.netAmountExVat),
            gross: formatMoney(row.grossAmount),
            ref: row.externalPaymentId ?? '-',
            source: row.source,
            status: (
              <AdminBadge
                label={row.status}
                variant={STATUS_VARIANT[row.status] ?? 'neutral'}
              />
            ),
            actions:
              row.status === 'PAID' ? (
                <button
                  type="button"
                  className="text-xs text-red-600 underline"
                  onClick={() => {
                    setCancelId(row.id)
                    setCancelReason('')
                  }}
                >
                  취소
                </button>
              ) : (
                '-'
              ),
          }))}
        />
      </div>

      {totalPages > 1 ? (
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-sm px-3 py-1 border rounded-lg disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-gray-600 py-1">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="text-sm px-3 py-1 border rounded-lg disabled:opacity-40"
          >
            다음
          </button>
        </div>
      ) : null}

      <AdminModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title="입금 확인 등록"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm border rounded-lg"
              onClick={() => setVerifyOpen(false)}
            >
              닫기
            </button>
            <button
              type="button"
              disabled={saving || !confirmChecked}
              onClick={() => void handleVerify()}
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-40"
            >
              {saving ? '등록 중…' : '확인 후 등록'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            실제 입금·회계자료 확인 후에만 등록하세요. 등록 후 수정할 수 없으며, 가짜 매출을
            만들면 정산·회계에 반영됩니다.
          </p>
          <label className="block">
            Partner ID
            <input
              className="mt-1 w-full border rounded-lg px-3 py-1.5"
              value={form.partnerId}
              onChange={(e) => setForm((f) => ({ ...f, partnerId: e.target.value }))}
            />
          </label>
          <label className="block">
            Subscription ID
            <input
              className="mt-1 w-full border rounded-lg px-3 py-1.5"
              value={form.subscriptionId}
              onChange={(e) => setForm((f) => ({ ...f, subscriptionId: e.target.value }))}
            />
          </label>
          <label className="block">
            외부 참조번호 (필수)
            <input
              className="mt-1 w-full border rounded-lg px-3 py-1.5"
              value={form.externalReference}
              onChange={(e) =>
                setForm((f) => ({ ...f, externalReference: e.target.value }))
              }
            />
          </label>
          <label className="block">
            결제일시
            <input
              type="datetime-local"
              className="mt-1 w-full border rounded-lg px-3 py-1.5"
              value={form.paidAt}
              onChange={(e) => setForm((f) => ({ ...f, paidAt: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              청구기간 시작
              <input
                type="datetime-local"
                className="mt-1 w-full border rounded-lg px-3 py-1.5"
                value={form.billingPeriodStart}
                onChange={(e) =>
                  setForm((f) => ({ ...f, billingPeriodStart: e.target.value }))
                }
              />
            </label>
            <label className="block">
              청구기간 종료
              <input
                type="datetime-local"
                className="mt-1 w-full border rounded-lg px-3 py-1.5"
                value={form.billingPeriodEnd}
                onChange={(e) =>
                  setForm((f) => ({ ...f, billingPeriodEnd: e.target.value }))
                }
              />
            </label>
          </div>
          <label className="block">
            VAT 제외 금액 (정산 기준)
            <input
              className="mt-1 w-full border rounded-lg px-3 py-1.5"
              value={form.netAmountExVat}
              onChange={(e) => syncGrossFromNet(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              VAT
              <input
                className="mt-1 w-full border rounded-lg px-3 py-1.5 bg-gray-50"
                value={form.vatAmount}
                readOnly
              />
            </label>
            <label className="block">
              총액 (VAT 포함)
              <input
                className="mt-1 w-full border rounded-lg px-3 py-1.5 bg-gray-50"
                value={form.grossAmount}
                readOnly
              />
            </label>
          </div>
          <label className="block">
            결제수단
            <input
              className="mt-1 w-full border rounded-lg px-3 py-1.5"
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
            />
          </label>
          <label className="block">
            메모
            <textarea
              className="mt-1 w-full border rounded-lg px-3 py-1.5"
              rows={2}
              value={form.memo}
              onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            />
          </label>
          <label className="flex items-start gap-2 text-amber-900">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
            />
            <span>
              실제 입금을 확인했으며, 등록 후 수정 불가함을 이해합니다. 잘못 등록하면
              취소/조정이 필요합니다.
            </span>
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={cancelId != null}
        onClose={() => setCancelId(null)}
        title="결제 원천 취소"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm border rounded-lg"
              onClick={() => setCancelId(null)}
            >
              닫기
            </button>
            <button
              type="button"
              disabled={saving || !cancelReason.trim()}
              onClick={() => void handleCancel()}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white disabled:opacity-40"
            >
              취소 처리
            </button>
          </div>
        }
      >
        <div className="space-y-2 text-sm">
          <p>삭제되지 않고 CANCELLED로 표시됩니다. 확정 정산에 포함된 건은 취소할 수 없습니다.</p>
          <label className="block">
            사유
            <input
              className="mt-1 w-full border rounded-lg px-3 py-1.5"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </label>
        </div>
      </AdminModal>
    </div>
  )
}
