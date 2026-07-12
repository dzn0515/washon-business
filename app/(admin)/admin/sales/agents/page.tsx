'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import SalesSubNav from '@/components/admin/SalesSubNav'
import {
  createAdminSalesAgent,
  deleteAdminSalesAgent,
  fetchAdminSalesAgencies,
  fetchAdminSalesAgents,
  fetchAdminSalesDistributors,
  updateAdminSalesAgent,
  updateAdminSalesAgentStatus,
  type AdminSalesAgency,
  type AdminSalesAgent,
  type AdminSalesDistributor,
  type SalesEmploymentType,
  type SalesOrgStatus,
} from '@/lib/admin-api'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '정지',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'error',
}

const EMPLOYMENT_LABEL: Record<string, string> = {
  DIRECT: '본사 직속',
  DISTRIBUTOR: '총판 직속',
  AGENCY: '영업점',
  FREELANCER: '프리랜서',
}

const PAGE_SIZE = 20

const EMPTY_FORM = {
  name: '',
  code: '',
  phone: '',
  email: '',
  status: 'ACTIVE' as SalesOrgStatus,
  employmentType: 'DIRECT' as SalesEmploymentType,
  distributorId: '',
  agencyId: '',
  joinedAt: '',
  memo: '',
}

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function AdminSalesAgentsPage() {
  const [items, setItems] = useState<AdminSalesAgent[]>([])
  const [distributors, setDistributors] = useState<AdminSalesDistributor[]>([])
  const [agencies, setAgencies] = useState<AdminSalesAgency[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [employmentType, setEmploymentType] = useState('all')
  const [distributorId, setDistributorId] = useState('')
  const [agencyId, setAgencyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminSalesAgent | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<AdminSalesAgent | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchAdminSalesAgents({
        keyword: keyword || undefined,
        status,
        employmentType,
        distributorId: distributorId || undefined,
        agencyId: agencyId || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(list.items)
      setTotal(list.total)
      setTotalPages(list.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '영업사원을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [keyword, status, employmentType, distributorId, agencyId, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void fetchAdminSalesDistributors({ pageSize: 100 })
      .then((res) => setDistributors(res.items))
      .catch(() => setDistributors([]))
  }, [])

  const formDistributorId = form.distributorId

  useEffect(() => {
    const distId = formOpen ? formDistributorId : distributorId
    if (!distId) {
      setAgencies([])
      return
    }
    void fetchAdminSalesAgencies({ distributorId: distId, pageSize: 100 })
      .then((res) => setAgencies(res.items))
      .catch(() => setAgencies([]))
  }, [distributorId, formDistributorId, formOpen])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...EMPTY_FORM,
      distributorId: distributorId || '',
      agencyId: agencyId || '',
    })
    setFormOpen(true)
  }

  const openEdit = (row: AdminSalesAgent) => {
    setEditing(row)
    setForm({
      name: row.name,
      code: row.code,
      phone: row.phone || '',
      email: row.email || '',
      status: (row.status as SalesOrgStatus) || 'ACTIVE',
      employmentType: (row.employmentType as SalesEmploymentType) || 'DIRECT',
      distributorId: row.distributorId || '',
      agencyId: row.agencyId || '',
      joinedAt: row.joinedAt || '',
      memo: row.memo || '',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) return
    setSaving(true)
    setError(null)
    try {
      const body = {
        name: form.name.trim(),
        code: form.code.trim(),
        phone: form.phone || null,
        email: form.email || null,
        employmentType: form.employmentType,
        distributorId: form.distributorId ? Number(form.distributorId) : null,
        agencyId: form.agencyId ? Number(form.agencyId) : null,
        joinedAt: form.joinedAt || null,
        memo: form.memo || null,
      }
      if (editing) {
        await updateAdminSalesAgent(editing.id, body)
      } else {
        await createAdminSalesAgent({ ...body, status: form.status })
      }
      setFormOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = async (id: string, next: SalesOrgStatus) => {
    try {
      await updateAdminSalesAgentStatus(id, next)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteAdminSalesAgent(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const tableData = useMemo(
    () =>
      items.map((row) => ({
        name: (
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-500">{row.code}</p>
          </div>
        ),
        employment: (
          <span className="text-sm">
            {EMPLOYMENT_LABEL[row.employmentType] ?? row.employmentType}
          </span>
        ),
        org: (
          <div className="text-sm">
            <p>{row.distributorName || '본사'}</p>
            <p className="text-xs text-gray-500">{row.agencyName || '-'}</p>
          </div>
        ),
        contact: <span className="text-sm">{row.phone || row.email || '-'}</span>,
        partners: <span className="text-sm">{row.partnerCount}</span>,
        commission: (
          <span className="text-sm">{formatMoney(row.estimatedMonthlyCommission)}</span>
        ),
        status: (
          <AdminBadge
            label={STATUS_LABEL[row.status] ?? row.status}
            variant={STATUS_VARIANT[row.status] ?? 'neutral'}
          />
        ),
        actions: (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="text-sm text-blue-600" onClick={() => openEdit(row)}>
              수정
            </button>
            {row.status === 'ACTIVE' ? (
              <button
                type="button"
                className="text-sm text-amber-600"
                onClick={() => void handleStatus(row.id, 'SUSPENDED')}
              >
                정지
              </button>
            ) : (
              <button
                type="button"
                className="text-sm text-green-600"
                onClick={() => void handleStatus(row.id, 'ACTIVE')}
              >
                활성
              </button>
            )}
            <button
              type="button"
              className="text-sm text-red-500"
              onClick={() => setDeleteTarget(row)}
            >
              삭제
            </button>
          </div>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="영업사원 관리"
        description="고용유형·소속별 영업사원을 관리합니다"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            + 영업사원 등록
          </button>
        }
      />

      <SalesSubNav />

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={keyword}
          onChange={(e) => {
            setPage(1)
            setKeyword(e.target.value)
          }}
          placeholder="이름·코드 검색"
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        />
        <select
          value={employmentType}
          onChange={(e) => {
            setPage(1)
            setEmploymentType(e.target.value)
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          <option value="all">전체 고용유형</option>
          <option value="DIRECT">본사 직속</option>
          <option value="DISTRIBUTOR">총판 직속</option>
          <option value="AGENCY">영업점</option>
          <option value="FREELANCER">프리랜서</option>
        </select>
        <select
          value={distributorId}
          onChange={(e) => {
            setPage(1)
            setDistributorId(e.target.value)
            setAgencyId('')
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          <option value="">전체 총판</option>
          {distributors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={agencyId}
          onChange={(e) => {
            setPage(1)
            setAgencyId(e.target.value)
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
          disabled={!distributorId}
        >
          <option value="">전체 영업점</option>
          {agencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value)
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          <option value="all">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">비활성</option>
          <option value="SUSPENDED">정지</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setKeyword('')
            setStatus('all')
            setEmploymentType('all')
            setDistributorId('')
            setAgencyId('')
            setPage(1)
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          새로고침
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg flex justify-between gap-3">
          <span>{error}</span>
          <button type="button" className="underline" onClick={() => void load()}>
            재시도
          </button>
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <AdminTable
          loading={loading}
          columns={[
            { key: 'name', label: '영업사원' },
            { key: 'employment', label: '고용유형', width: '100px' },
            { key: 'org', label: '소속' },
            { key: 'contact', label: '연락처' },
            { key: 'partners', label: '업체', width: '70px' },
            { key: 'commission', label: '예상 수수료', width: '110px' },
            { key: 'status', label: '상태', width: '90px' },
            { key: 'actions', label: '', width: '160px' },
          ]}
          data={tableData}
          emptyMessage="등록된 영업사원이 없습니다."
        />
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
          >
            이전
          </button>
          <span>
            {page} / {totalPages} · 총 {total}건
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
          >
            다음
          </button>
        </div>
      ) : null}

      <AdminModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? '영업사원 수정' : '영업사원 등록'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving || !form.name.trim() || !form.code.trim()}
              onClick={() => void handleSave()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-gray-600">이름 *</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">코드 *</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">고용유형</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.employmentType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  employmentType: e.target.value as SalesEmploymentType,
                }))
              }
            >
              <option value="DIRECT">본사 직속</option>
              <option value="DISTRIBUTOR">총판 직속</option>
              <option value="AGENCY">영업점</option>
              <option value="FREELANCER">프리랜서</option>
            </select>
          </label>
          {!editing ? (
            <label className="space-y-1">
              <span className="text-gray-600">상태</span>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as SalesOrgStatus }))
                }
              >
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
                <option value="SUSPENDED">정지</option>
              </select>
            </label>
          ) : null}
          <label className="space-y-1">
            <span className="text-gray-600">총판</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.distributorId}
              onChange={(e) =>
                setForm((f) => ({ ...f, distributorId: e.target.value, agencyId: '' }))
              }
            >
              <option value="">없음 (본사)</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">영업점</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.agencyId}
              onChange={(e) => setForm((f) => ({ ...f, agencyId: e.target.value }))}
              disabled={!form.distributorId}
            >
              <option value="">없음</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">연락처</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">이메일</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">입사일</span>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              value={form.joinedAt}
              onChange={(e) => setForm((f) => ({ ...f, joinedAt: e.target.value }))}
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-gray-600">메모</span>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              value={form.memo}
              onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            />
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="영업사원 삭제"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setDeleteTarget(null)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm disabled:opacity-40"
              onClick={() => void handleDelete()}
            >
              {saving ? '삭제 중...' : '삭제'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          <strong>{deleteTarget?.name}</strong> 영업사원을 삭제할까요? 활성 배정이 있으면 삭제할
          수 없습니다.
        </p>
      </AdminModal>
    </div>
  )
}
