'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import SalesSubNav from '@/components/admin/SalesSubNav'
import {
  createAdminSalesAgency,
  deleteAdminSalesAgency,
  fetchAdminSalesAgencies,
  fetchAdminSalesDistributors,
  updateAdminSalesAgency,
  updateAdminSalesAgencyStatus,
  type AdminSalesAgency,
  type AdminSalesDistributor,
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

const PAGE_SIZE = 20

const EMPTY_FORM = {
  distributorId: '',
  name: '',
  code: '',
  representativeName: '',
  phone: '',
  email: '',
  region: '',
  status: 'ACTIVE' as SalesOrgStatus,
  memo: '',
}

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function AdminSalesAgenciesPage() {
  const [items, setItems] = useState<AdminSalesAgency[]>([])
  const [distributors, setDistributors] = useState<AdminSalesDistributor[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [distributorId, setDistributorId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminSalesAgency | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<AdminSalesAgency | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchAdminSalesAgencies({
        keyword: keyword || undefined,
        status,
        distributorId: distributorId || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(list.items)
      setTotal(list.total)
      setTotalPages(list.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '영업점을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [keyword, status, distributorId, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void fetchAdminSalesDistributors({ pageSize: 100 })
      .then((res) => setDistributors(res.items))
      .catch(() => setDistributors([]))
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, distributorId: distributorId || '' })
    setFormOpen(true)
  }

  const openEdit = (row: AdminSalesAgency) => {
    setEditing(row)
    setForm({
      distributorId: row.distributorId,
      name: row.name,
      code: row.code,
      representativeName: row.representativeName || '',
      phone: row.phone || '',
      email: row.email || '',
      region: row.region || '',
      status: (row.status as SalesOrgStatus) || 'ACTIVE',
      memo: row.memo || '',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.distributorId) return
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await updateAdminSalesAgency(editing.id, {
          distributorId: Number(form.distributorId),
          name: form.name.trim(),
          code: form.code.trim(),
          representativeName: form.representativeName || null,
          phone: form.phone || null,
          email: form.email || null,
          region: form.region || null,
          memo: form.memo || null,
        })
      } else {
        await createAdminSalesAgency({
          distributorId: Number(form.distributorId),
          name: form.name.trim(),
          code: form.code.trim(),
          representativeName: form.representativeName || null,
          phone: form.phone || null,
          email: form.email || null,
          region: form.region || null,
          status: form.status,
          memo: form.memo || null,
        })
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
      await updateAdminSalesAgencyStatus(id, next)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteAdminSalesAgency(deleteTarget.id)
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
        distributor: <span className="text-sm">{row.distributorName || '-'}</span>,
        contact: (
          <div className="text-sm">
            <p>{row.representativeName || '-'}</p>
            <p className="text-xs text-gray-500">{row.phone || '-'}</p>
          </div>
        ),
        counts: (
          <span className="text-sm">
            사원 {row.agentCount} · 업체 {row.partnerCount}
          </span>
        ),
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
        title="영업점 관리"
        description="총판 소속 영업점을 관리합니다"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            + 영업점 등록
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
          placeholder="영업점명·코드 검색"
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        />
        <select
          value={distributorId}
          onChange={(e) => {
            setPage(1)
            setDistributorId(e.target.value)
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
            setDistributorId('')
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
            { key: 'name', label: '영업점' },
            { key: 'distributor', label: '총판' },
            { key: 'contact', label: '연락처' },
            { key: 'counts', label: '구성' },
            { key: 'commission', label: '예상 수수료', width: '110px' },
            { key: 'status', label: '상태', width: '90px' },
            { key: 'actions', label: '', width: '160px' },
          ]}
          data={tableData}
          emptyMessage="등록된 영업점이 없습니다."
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
        title={editing ? '영업점 수정' : '영업점 등록'}
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
              disabled={
                saving || !form.name.trim() || !form.code.trim() || !form.distributorId
              }
              onClick={() => void handleSave()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <label className="space-y-1 md:col-span-2">
            <span className="text-gray-600">총판 *</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.distributorId}
              onChange={(e) => setForm((f) => ({ ...f, distributorId: e.target.value }))}
            >
              <option value="">선택</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">영업점명 *</span>
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
            <span className="text-gray-600">대표자</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.representativeName}
              onChange={(e) => setForm((f) => ({ ...f, representativeName: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">지역</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            />
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
        title="영업점 삭제"
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
          <strong>{deleteTarget?.name}</strong> 영업점을 삭제할까요? 하위 영업사원이 있으면
          삭제할 수 없습니다.
        </p>
      </AdminModal>
    </div>
  )
}
