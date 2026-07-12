'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminModal from '@/components/admin/AdminModal'
import SalesSubNav from '@/components/admin/SalesSubNav'
import {
  createAdminSalesAssignment,
  fetchAdminSalesAgents,
  fetchAdminSalesAssignments,
  fetchAdminSalesUnassignedPartners,
  reassignAdminSalesAssignment,
  unassignAdminSalesAssignment,
  type AdminSalesAgent,
  type AdminSalesAssignment,
  type AdminSalesUnassignedPartner,
} from '@/lib/admin-api'

const PAGE_SIZE = 20

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function AdminSalesAssignmentsPage() {
  const [assigned, setAssigned] = useState<AdminSalesAssignment[]>([])
  const [unassigned, setUnassigned] = useState<AdminSalesUnassignedPartner[]>([])
  const [agents, setAgents] = useState<AdminSalesAgent[]>([])
  const [assignedTotal, setAssignedTotal] = useState(0)
  const [assignedPages, setAssignedPages] = useState(1)
  const [unassignedTotal, setUnassignedTotal] = useState(0)
  const [unassignedPages, setUnassignedPages] = useState(1)
  const [assignedPage, setAssignedPage] = useState(1)
  const [unassignedPage, setUnassignedPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [unassignedKeyword, setUnassignedKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [unassignedLoading, setUnassignedLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignPartner, setAssignPartner] = useState<AdminSalesUnassignedPartner | null>(null)
  const [reassignTarget, setReassignTarget] = useState<AdminSalesAssignment | null>(null)
  const [unassignTarget, setUnassignTarget] = useState<AdminSalesAssignment | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [memo, setMemo] = useState('')

  const loadAssigned = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchAdminSalesAssignments({
        keyword: keyword || undefined,
        page: assignedPage,
        pageSize: PAGE_SIZE,
      })
      setAssigned(list.items)
      setAssignedTotal(list.total)
      setAssignedPages(list.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '배정 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [keyword, assignedPage])

  const loadUnassigned = useCallback(async () => {
    setUnassignedLoading(true)
    try {
      const list = await fetchAdminSalesUnassignedPartners({
        keyword: unassignedKeyword || undefined,
        page: unassignedPage,
        pageSize: PAGE_SIZE,
      })
      setUnassigned(list.items)
      setUnassignedTotal(list.total)
      setUnassignedPages(list.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '미배정 업체를 불러오지 못했습니다.')
    } finally {
      setUnassignedLoading(false)
    }
  }, [unassignedKeyword, unassignedPage])

  useEffect(() => {
    void loadAssigned()
  }, [loadAssigned])

  useEffect(() => {
    void loadUnassigned()
  }, [loadUnassigned])

  useEffect(() => {
    void fetchAdminSalesAgents({ status: 'ACTIVE', pageSize: 100 })
      .then((res) => setAgents(res.items))
      .catch(() => setAgents([]))
  }, [])

  const openAssign = (partner: AdminSalesUnassignedPartner) => {
    setAssignPartner(partner)
    setSelectedAgentId('')
    setMemo('')
    setAssignOpen(true)
  }

  const openReassign = (row: AdminSalesAssignment) => {
    setReassignTarget(row)
    setSelectedAgentId(row.salesAgentId)
    setMemo(row.memo || '')
  }

  const handleAssign = async () => {
    if (!assignPartner || !selectedAgentId) return
    setSaving(true)
    setError(null)
    try {
      await createAdminSalesAssignment({
        partnerId: Number(assignPartner.partnerId),
        salesAgentId: Number(selectedAgentId),
        memo: memo || null,
      })
      setAssignOpen(false)
      setAssignPartner(null)
      await Promise.all([loadAssigned(), loadUnassigned()])
    } catch (e) {
      setError(e instanceof Error ? e.message : '배정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleReassign = async () => {
    if (!reassignTarget || !selectedAgentId) return
    setSaving(true)
    setError(null)
    try {
      await reassignAdminSalesAssignment(reassignTarget.partnerId, {
        salesAgentId: Number(selectedAgentId),
        memo: memo || null,
      })
      setReassignTarget(null)
      await loadAssigned()
    } catch (e) {
      setError(e instanceof Error ? e.message : '재배정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleUnassign = async () => {
    if (!unassignTarget) return
    setSaving(true)
    setError(null)
    try {
      await unassignAdminSalesAssignment(unassignTarget.partnerId)
      setUnassignTarget(null)
      await Promise.all([loadAssigned(), loadUnassigned()])
    } catch (e) {
      setError(e instanceof Error ? e.message : '배정 해제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const assignedData = useMemo(
    () =>
      assigned.map((row) => ({
        partner: (
          <div>
            <p className="font-medium text-gray-900">{row.partnerName}</p>
            <p className="text-xs text-gray-500">
              {row.planTier || '-'} · {row.bizType || '-'}
            </p>
          </div>
        ),
        agent: <span className="text-sm">{row.salesAgentName}</span>,
        org: (
          <span className="text-sm text-gray-600">
            {[row.distributorName, row.agencyName].filter(Boolean).join(' / ') || '본사 직속'}
          </span>
        ),
        commission: (
          <span className="text-sm">{formatMoney(row.estimatedMonthlyCommission)}</span>
        ),
        assignedAt: (
          <span className="text-sm text-gray-500">
            {row.assignedAt ? new Date(row.assignedAt).toLocaleDateString('ko-KR') : '-'}
          </span>
        ),
        actions: (
          <div className="flex gap-2">
            <button
              type="button"
              className="text-sm text-blue-600"
              onClick={() => openReassign(row)}
            >
              재배정
            </button>
            <button
              type="button"
              className="text-sm text-red-500"
              onClick={() => setUnassignTarget(row)}
            >
              해제
            </button>
          </div>
        ),
      })),
    [assigned],
  )

  const unassignedData = useMemo(
    () =>
      unassigned.map((row) => ({
        partner: (
          <div>
            <p className="font-medium text-gray-900">{row.partnerName}</p>
            <p className="text-xs text-gray-500">
              {row.planTier || '-'} · {row.bizType || '-'} · {row.region || '-'}
            </p>
          </div>
        ),
        status: <span className="text-sm">{row.status}</span>,
        actions: (
          <button
            type="button"
            className="text-sm text-blue-600"
            onClick={() => openAssign(row)}
          >
            배정
          </button>
        ),
      })),
    [unassigned],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="업체 배정"
        description="영업사원에게 업체를 배정·재배정·해제합니다"
        actions={
          <button
            type="button"
            onClick={() => {
              void loadAssigned()
              void loadUnassigned()
            }}
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
          <button
            type="button"
            className="underline"
            onClick={() => {
              void loadAssigned()
              void loadUnassigned()
            }}
          >
            재시도
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">배정된 업체 ({assignedTotal})</h2>
          <input
            value={keyword}
            onChange={(e) => {
              setAssignedPage(1)
              setKeyword(e.target.value)
            }}
            placeholder="업체·사원 검색"
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
          />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <AdminTable
            loading={loading}
            columns={[
              { key: 'partner', label: '업체' },
              { key: 'agent', label: '영업사원' },
              { key: 'org', label: '소속' },
              { key: 'commission', label: '예상 수수료', width: '110px' },
              { key: 'assignedAt', label: '배정일', width: '110px' },
              { key: 'actions', label: '', width: '120px' },
            ]}
            data={assignedData}
            emptyMessage="배정된 업체가 없습니다."
          />
        </div>
        {assignedPages > 1 ? (
          <div className="flex items-center justify-center gap-3 text-sm">
            <button
              type="button"
              disabled={assignedPage <= 1}
              onClick={() => setAssignedPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
            >
              이전
            </button>
            <span>
              {assignedPage} / {assignedPages}
            </span>
            <button
              type="button"
              disabled={assignedPage >= assignedPages}
              onClick={() => setAssignedPage((p) => Math.min(assignedPages, p + 1))}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
            >
              다음
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">미배정 업체 ({unassignedTotal})</h2>
          <input
            value={unassignedKeyword}
            onChange={(e) => {
              setUnassignedPage(1)
              setUnassignedKeyword(e.target.value)
            }}
            placeholder="미배정 업체 검색"
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
          />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <AdminTable
            loading={unassignedLoading}
            columns={[
              { key: 'partner', label: '업체' },
              { key: 'status', label: '상태', width: '100px' },
              { key: 'actions', label: '', width: '80px' },
            ]}
            data={unassignedData}
            emptyMessage="미배정 업체가 없습니다."
          />
        </div>
        {unassignedPages > 1 ? (
          <div className="flex items-center justify-center gap-3 text-sm">
            <button
              type="button"
              disabled={unassignedPage <= 1}
              onClick={() => setUnassignedPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
            >
              이전
            </button>
            <span>
              {unassignedPage} / {unassignedPages}
            </span>
            <button
              type="button"
              disabled={unassignedPage >= unassignedPages}
              onClick={() => setUnassignedPage((p) => Math.min(unassignedPages, p + 1))}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
            >
              다음
            </button>
          </div>
        ) : null}
      </div>

      <AdminModal
        open={assignOpen}
        onClose={() => {
          setAssignOpen(false)
          setAssignPartner(null)
        }}
        title="업체 배정"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => {
                setAssignOpen(false)
                setAssignPartner(null)
              }}
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving || !selectedAgentId}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
              onClick={() => void handleAssign()}
            >
              {saving ? '배정 중...' : '배정'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p>
            <span className="text-gray-500">업체:</span>{' '}
            <strong>{assignPartner?.partnerName}</strong>
          </p>
          <label className="block space-y-1">
            <span className="text-gray-600">영업사원 *</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              <option value="">선택</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.agencyName || a.distributorName
                    ? ` (${[a.distributorName, a.agencyName].filter(Boolean).join(' / ')})`
                    : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-gray-600">메모</span>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={!!reassignTarget}
        onClose={() => setReassignTarget(null)}
        title="재배정 확인"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setReassignTarget(null)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving || !selectedAgentId}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
              onClick={() => void handleReassign()}
            >
              {saving ? '처리 중...' : '재배정'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-gray-600">
            <strong>{reassignTarget?.partnerName}</strong> 업체의 기존 배정을 해제하고 새
            영업사원에게 배정합니다.
          </p>
          <p>
            현재: <strong>{reassignTarget?.salesAgentName}</strong>
          </p>
          <label className="block space-y-1">
            <span className="text-gray-600">새 영업사원 *</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              <option value="">선택</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-gray-600">메모</span>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={!!unassignTarget}
        onClose={() => setUnassignTarget(null)}
        title="배정 해제 확인"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setUnassignTarget(null)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm disabled:opacity-40"
              onClick={() => void handleUnassign()}
            >
              {saving ? '해제 중...' : '해제'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          <strong>{unassignTarget?.partnerName}</strong> 업체의{' '}
          <strong>{unassignTarget?.salesAgentName}</strong> 배정을 해제할까요?
        </p>
      </AdminModal>
    </div>
  )
}
