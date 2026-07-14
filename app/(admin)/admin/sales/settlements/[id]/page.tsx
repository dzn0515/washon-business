'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import SalesSubNav from '@/components/admin/SalesSubNav'
import {
  calculateAdminSalesSettlement,
  cancelAdminSalesSettlement,
  confirmAdminSalesSettlement,
  exportAdminSalesSettlement,
  fetchAdminSalesSettlement,
  fetchAdminSalesSettlementLines,
  holdAdminSalesSettlementLine,
  markAdminSalesSettlementPaid,
  markAdminSalesSettlementPaymentPending,
  recalculateAdminSalesSettlement,
  releaseAdminSalesSettlementLine,
  type AdminSettlementBatchDetail,
  type AdminSettlementLine,
} from '@/lib/admin-api'

const LINE_PAGE_SIZE = 50

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '초안',
  CALCULATED: '산출됨',
  CONFIRMED: '확정',
  PAYMENT_PENDING: '지급대기',
  PAID: '지급완료',
  CANCELLED: '취소',
  PENDING: '대기',
  HELD: '보류',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error' | 'info'> = {
  DRAFT: 'neutral',
  CALCULATED: 'info',
  CONFIRMED: 'success',
  PAYMENT_PENDING: 'warning',
  PAID: 'success',
  CANCELLED: 'error',
  PENDING: 'neutral',
  HELD: 'warning',
}

const RECIPIENT_LABEL: Record<string, string> = {
  SALES_AGENT: '영업사원',
  SALES_AGENCY: '영업점',
  SALES_DISTRIBUTOR: '총판',
}

type ConfirmAction =
  | 'calculate'
  | 'recalculate'
  | 'confirm'
  | 'payment-pending'
  | 'paid'
  | 'cancel'
  | 'hold'
  | 'release'

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('ko-KR')
}

export default function AdminSalesSettlementDetailPage() {
  const params = useParams()
  const id = String(params?.id ?? '')

  const [batch, setBatch] = useState<AdminSettlementBatchDetail | null>(null)
  const [lines, setLines] = useState<AdminSettlementLine[]>([])
  const [lineTotal, setLineTotal] = useState(0)
  const [linePage, setLinePage] = useState(1)
  const [lineTotalPages, setLineTotalPages] = useState(1)
  const [lineStatus, setLineStatus] = useState('all')
  const [recipientType, setRecipientType] = useState('all')
  const [partnerInput, setPartnerInput] = useState('')
  const [partnerFilter, setPartnerFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [linesLoading, setLinesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [targetLine, setTargetLine] = useState<AdminSettlementLine | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [holdReason, setHoldReason] = useState('')
  const [paidRef, setPaidRef] = useState('')
  const [paidMemo, setPaidMemo] = useState('')

  const loadBatch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const detail = await fetchAdminSalesSettlement(id)
      setBatch(detail)
    } catch (e) {
      setError(e instanceof Error ? e.message : '정산 상세를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadLines = useCallback(async () => {
    if (!id) return
    setLinesLoading(true)
    try {
      const list = await fetchAdminSalesSettlementLines(id, {
        lineStatus,
        recipientType,
        partner: partnerFilter.trim() || undefined,
        page: linePage,
        pageSize: LINE_PAGE_SIZE,
      })
      setLines(list.items)
      setLineTotal(list.total)
      setLineTotalPages(list.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '정산 라인을 불러오지 못했습니다.')
    } finally {
      setLinesLoading(false)
    }
  }, [id, lineStatus, recipientType, partnerFilter, linePage])

  useEffect(() => {
    void loadBatch()
  }, [loadBatch])

  useEffect(() => {
    void loadLines()
  }, [loadLines])

  const refresh = async () => {
    await Promise.all([loadBatch(), loadLines()])
  }

  const runAction = async () => {
    if (!id || !confirmAction) return
    setActing(true)
    setError(null)
    try {
      switch (confirmAction) {
        case 'calculate':
          await calculateAdminSalesSettlement(id)
          break
        case 'recalculate':
          await recalculateAdminSalesSettlement(id)
          break
        case 'confirm':
          await confirmAdminSalesSettlement(id)
          break
        case 'payment-pending':
          await markAdminSalesSettlementPaymentPending(id)
          break
        case 'paid':
          await markAdminSalesSettlementPaid(id, {
            externalReference: paidRef.trim() || null,
            memo: paidMemo.trim() || null,
          })
          break
        case 'cancel':
          if (!cancelReason.trim()) throw new Error('취소 사유를 입력하세요.')
          await cancelAdminSalesSettlement(id, cancelReason.trim())
          break
        case 'hold':
          if (!targetLine || !holdReason.trim()) throw new Error('보류 사유를 입력하세요.')
          await holdAdminSalesSettlementLine(id, targetLine.id, holdReason.trim())
          break
        case 'release':
          if (!targetLine) throw new Error('라인을 선택하세요.')
          await releaseAdminSalesSettlementLine(id, targetLine.id)
          break
      }
      setConfirmAction(null)
      setTargetLine(null)
      setCancelReason('')
      setHoldReason('')
      setPaidRef('')
      setPaidMemo('')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리에 실패했습니다.')
    } finally {
      setActing(false)
    }
  }

  const handleExport = async () => {
    if (!id) return
    setError(null)
    try {
      await exportAdminSalesSettlement(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CSV 내보내기에 실패했습니다.')
    }
  }

  const status = batch?.status ?? ''
  const canCalculate = status === 'DRAFT'
  const canRecalculate = status === 'DRAFT' || status === 'CALCULATED'
  const canConfirm = status === 'CALCULATED' && (batch?.eligiblePaymentCount ?? 0) > 0
  const canPaymentPending = status === 'CONFIRMED'
  const canPaid = status === 'PAYMENT_PENDING'
  const canCancel = status !== 'PAID' && status !== 'CANCELLED'
  const canHoldLine = status === 'DRAFT' || status === 'CALCULATED' || status === 'CONFIRMED'

  const modalTitle: Record<ConfirmAction, string> = {
    calculate: '정산 산출',
    recalculate: '재산출',
    confirm: '정산 확정',
    'payment-pending': '지급 대기로 전환',
    paid: '지급 완료 기록',
    cancel: '정산 취소',
    hold: '라인 보류',
    release: '보류 해제',
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={batch ? `${batch.settlementMonth} 정산` : '정산 상세'}
        description="구독료 VAT 제외 실제 결제 기준 · 예상 수수료와 별도"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/sales/settlements"
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              목록
            </Link>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              새로고침
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              CSV 내보내기
            </button>
          </div>
        }
      />

      <SalesSubNav />

      {error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg flex justify-between gap-3">
          <span>{error}</span>
          <button type="button" className="underline" onClick={() => void refresh()}>
            재시도
          </button>
        </div>
      ) : null}

      {loading && !batch ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : batch ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge
              label={STATUS_LABEL[batch.status] ?? batch.status}
              variant={STATUS_VARIANT[batch.status] ?? 'neutral'}
            />
            {!batch.estimated ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                확정 정산
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                예상(Estimated)
              </span>
            )}
            {batch.message ? (
              <span className="text-sm text-gray-500">{batch.message}</span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard icon="💳" label="순매출 (VAT 제외)" value={formatMoney(batch.totalNetSales)} color="blue" />
            <AdminStatCard icon="👤" label="영업사원" value={formatMoney(batch.totalAgentCommission)} color="green" />
            <AdminStatCard icon="🏪" label="영업점" value={formatMoney(batch.totalAgencyCommission)} color="purple" />
            <AdminStatCard icon="🏬" label="총판" value={formatMoney(batch.totalDistributorCommission)} color="orange" />
            <AdminStatCard icon="💰" label="총 수수료" value={formatMoney(batch.totalCommission)} color="blue" />
            <AdminStatCard icon="✅" label="지급대상" value={formatMoney(batch.totalPayableCommission)} color="green" />
            <AdminStatCard icon="🔒" label="보류" value={formatMoney(batch.totalHeldCommission)} color="orange" />
            <AdminStatCard
              icon="📄"
              label="대상 결제"
              value={`${batch.eligiblePaymentCount}/${batch.sourcePaymentCount}`}
              color="blue"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-gray-600">
              <p>산출: {formatDateTime(batch.calculatedAt)}</p>
              <p>확정: {formatDateTime(batch.confirmedAt)}</p>
              <p>지급대기: {formatDateTime(batch.paymentPendingAt)}</p>
              <p>지급완료: {formatDateTime(batch.paidAt)}</p>
              <p>외부 참조: {batch.externalPaymentReference || '-'}</p>
              <p>메모: {batch.memo || '-'}</p>
              {batch.cancelReason ? <p className="text-red-600">취소 사유: {batch.cancelReason}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {canCalculate ? (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
                  onClick={() => setConfirmAction('calculate')}
                >
                  산출
                </button>
              ) : null}
              {canRecalculate ? (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border text-sm"
                  onClick={() => setConfirmAction('recalculate')}
                >
                  재산출
                </button>
              ) : null}
              {canConfirm ? (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm"
                  onClick={() => setConfirmAction('confirm')}
                >
                  확정
                </button>
              ) : null}
              {canPaymentPending ? (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm"
                  onClick={() => setConfirmAction('payment-pending')}
                >
                  지급대기
                </button>
              ) : null}
              {canPaid ? (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm"
                  onClick={() => setConfirmAction('paid')}
                >
                  지급완료
                </button>
              ) : null}
              {canCancel ? (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm"
                  onClick={() => setConfirmAction('cancel')}
                >
                  취소
                </button>
              ) : null}
            </div>
            {canPaid || status === 'PAYMENT_PENDING' ? (
              <p className="text-xs text-gray-500">
                실제 송금은 시스템 외부에서 수행되며, 이 버튼은 지급 상태를 기록합니다.
              </p>
            ) : null}
          </div>

          {(batch.sourcePaymentCount === 0 || batch.message) &&
          (status === 'DRAFT' || status === 'CALCULATED') ? (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600">
              {batch.message || '실제 구독 결제 기록이 수집된 이후 정산 가능합니다.'}
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <h2 className="font-semibold text-gray-900 mr-auto">정산 라인</h2>
              <label className="space-y-1 text-sm">
                <span className="text-gray-600">수취 유형</span>
                <select
                  className="block border rounded-lg px-3 py-2"
                  value={recipientType}
                  onChange={(e) => {
                    setLinePage(1)
                    setRecipientType(e.target.value)
                  }}
                >
                  <option value="all">전체</option>
                  <option value="SALES_AGENT">영업사원</option>
                  <option value="SALES_AGENCY">영업점</option>
                  <option value="SALES_DISTRIBUTOR">총판</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-gray-600">라인 상태</span>
                <select
                  className="block border rounded-lg px-3 py-2"
                  value={lineStatus}
                  onChange={(e) => {
                    setLinePage(1)
                    setLineStatus(e.target.value)
                  }}
                >
                  <option value="all">전체</option>
                  <option value="PENDING">대기</option>
                  <option value="CONFIRMED">확정</option>
                  <option value="HELD">보류</option>
                  <option value="PAID">지급완료</option>
                  <option value="CANCELLED">취소</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-gray-600">업체</span>
                <div className="flex gap-2">
                  <input
                    className="block border rounded-lg px-3 py-2"
                    value={partnerInput}
                    onChange={(e) => setPartnerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setLinePage(1)
                        setPartnerFilter(partnerInput.trim())
                      }
                    }}
                    placeholder="업체명 검색"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 border rounded-lg text-sm"
                    onClick={() => {
                      setLinePage(1)
                      setPartnerFilter(partnerInput.trim())
                    }}
                  >
                    검색
                  </button>
                </div>
              </label>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <AdminTable
                loading={linesLoading}
                columns={[
                  { key: 'partner', label: '업체' },
                  { key: 'recipient', label: '수취인' },
                  { key: 'net', label: '결제액', width: '100px' },
                  { key: 'rate', label: '요율', width: '70px' },
                  { key: 'amount', label: '수수료', width: '100px' },
                  { key: 'month', label: '차월', width: '70px' },
                  { key: 'status', label: '상태', width: '90px' },
                  { key: 'actions', label: '', width: '120px' },
                ]}
                data={lines.map((line) => ({
                  partner: (
                    <div>
                      <p className="font-medium">{line.partnerName}</p>
                      <p className="text-xs text-gray-500">{line.planTier}</p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        유료 {line.eligibleMonthIndex}개월차
                        {line.tierRate != null ? ` · ${line.tierRate}%` : ''}
                      </p>
                    </div>
                  ),
                  recipient: (
                    <div>
                      <p className="font-medium">{line.recipientName}</p>
                      <p className="text-xs text-gray-500">
                        {RECIPIENT_LABEL[line.recipientType] ?? line.recipientType} · {line.recipientCode}
                      </p>
                    </div>
                  ),
                  net: formatMoney(line.paymentNetAmount),
                  rate: `${line.commissionRate}%`,
                  amount: formatMoney(line.commissionAmount),
                  month: `유료 ${line.eligibleMonthIndex}개월차`,
                  status: (
                    <div>
                      <AdminBadge
                        label={STATUS_LABEL[line.status] ?? line.status}
                        variant={STATUS_VARIANT[line.status] ?? 'neutral'}
                      />
                      {line.holdReason ? (
                        <p className="text-[11px] text-amber-700 mt-0.5">{line.holdReason}</p>
                      ) : null}
                    </div>
                  ),
                  actions: (
                    <div className="flex flex-wrap gap-1">
                      {canHoldLine && line.status !== 'HELD' && line.status !== 'PAID' && line.status !== 'CANCELLED' ? (
                        <button
                          type="button"
                          className="text-xs text-amber-700 underline"
                          onClick={() => {
                            setTargetLine(line)
                            setHoldReason('')
                            setConfirmAction('hold')
                          }}
                        >
                          보류
                        </button>
                      ) : null}
                      {line.status === 'HELD' ? (
                        <button
                          type="button"
                          className="text-xs text-blue-600 underline"
                          onClick={() => {
                            setTargetLine(line)
                            setConfirmAction('release')
                          }}
                        >
                          해제
                        </button>
                      ) : null}
                    </div>
                  ),
                }))}
                emptyMessage="실제 구독 결제 기록 수집 연동 전입니다. 원천 결제 기록이 있는 건만 확정 정산됩니다."
              />
            </div>

            {lineTotalPages > 1 ? (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  총 {lineTotal.toLocaleString('ko-KR')}건 · {linePage}/{lineTotalPages}페이지
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={linePage <= 1}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                    onClick={() => setLinePage((p) => Math.max(1, p - 1))}
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    disabled={linePage >= lineTotalPages}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                    onClick={() => setLinePage((p) => Math.min(lineTotalPages, p + 1))}
                  >
                    다음
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      <AdminModal
        open={!!confirmAction}
        onClose={() => {
          if (acting) return
          setConfirmAction(null)
          setTargetLine(null)
        }}
        title={confirmAction ? modalTitle[confirmAction] : ''}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              disabled={acting}
              onClick={() => {
                setConfirmAction(null)
                setTargetLine(null)
              }}
            >
              닫기
            </button>
            <button
              type="button"
              disabled={acting}
              className={`px-3 py-1.5 rounded-lg text-sm text-white disabled:opacity-40 ${
                confirmAction === 'cancel' || confirmAction === 'hold'
                  ? 'bg-red-600'
                  : 'bg-blue-600'
              }`}
              onClick={() => void runAction()}
            >
              {acting ? '처리 중...' : '확인'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-gray-600">
          {confirmAction === 'calculate' ? (
            <p>VAT 제외 실제 결제 기준으로 수수료를 산출할까요?</p>
          ) : null}
          {confirmAction === 'recalculate' ? (
            <p>기존 라인을 삭제하고 다시 산출합니다. 계속할까요?</p>
          ) : null}
          {confirmAction === 'confirm' ? (
            <p>산출된 정산을 확정할까요? 확정 후에는 재산출할 수 없습니다.</p>
          ) : null}
          {confirmAction === 'payment-pending' ? (
            <p>상태를 지급대기로 전환할까요?</p>
          ) : null}
          {confirmAction === 'paid' ? (
            <>
              <p>지급 완료로 기록할까요?</p>
              <p className="text-xs text-gray-500">
                실제 송금은 시스템 외부에서 수행되며, 이 버튼은 지급 상태를 기록합니다.
              </p>
              <label className="block space-y-1">
                <span>외부 참조번호 (선택)</span>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={paidRef}
                  onChange={(e) => setPaidRef(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span>메모 (선택)</span>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={paidMemo}
                  onChange={(e) => setPaidMemo(e.target.value)}
                />
              </label>
            </>
          ) : null}
          {confirmAction === 'cancel' ? (
            <>
              <p>정산 배치를 취소합니다. 라인은 삭제되며 동일 결제를 다시 정산할 수 있습니다.</p>
              <label className="block space-y-1">
                <span>취소 사유</span>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="필수"
                />
              </label>
            </>
          ) : null}
          {confirmAction === 'hold' ? (
            <>
              <p>
                {targetLine?.recipientName} / {targetLine?.partnerName} 라인을 보류합니다.
              </p>
              <label className="block space-y-1">
                <span>보류 사유</span>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="필수"
                />
              </label>
            </>
          ) : null}
          {confirmAction === 'release' ? (
            <p>
              {targetLine?.recipientName} / {targetLine?.partnerName} 보류를 해제할까요?
            </p>
          ) : null}
        </div>
      </AdminModal>
    </div>
  )
}
