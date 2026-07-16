'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import { PermissionGate } from '@/components/admin/PermissionGate'
import {
  activateAdminStaff,
  createAdminStaff,
  deactivateAdminStaff,
  deleteAdminStaff,
  fetchAdminSalesDistributors,
  fetchAdminStaff,
  formatAdminPermissionError,
  resetAdminStaffPassword,
  type AdminSalesDistributor,
  type AdminStaffItem,
} from '@/lib/admin-api'
import { ADMIN_ROLES } from '@/lib/admin-permissions'

export default function AdminStaffPage() {
  const { showToast, ToastComponent } = useToast()
  const [items, setItems] = useState<AdminStaffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminStaffItem | null>(null)
  const [distributors, setDistributors] = useState<AdminSalesDistributor[]>([])
  const [createdCred, setCreatedCred] = useState<{ email: string; password: string } | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'ADMIN',
    distributorId: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAdminStaff({
        q: q || undefined,
        role: role === 'all' ? undefined : role,
        page,
        pageSize: 20,
      })
      setItems(res.items)
      setTotalPages(res.totalPages)
    } catch (e) {
      showToast(formatAdminPermissionError(e, '직원 목록을 불러오지 못했습니다.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [q, role, page, showToast])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void fetchAdminSalesDistributors({ page: 1, pageSize: 100 })
      .then((r) => setDistributors(r.items))
      .catch(() => setDistributors([]))
  }, [])

  const tableData = useMemo(
    () =>
      items.map((row) => ({
        name: row.name,
        email: row.email ?? '-',
        roleLabel: row.roleLabel,
        org:
          row.organizationType === 'DISTRIBUTOR'
            ? row.distributorName || row.distributorId || '-'
            : '본사',
        status: row.isActive ? '활성' : '비활성',
        lastLogin: row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('ko-KR') : '-',
        actions: (
          <div className="flex flex-wrap gap-1">
            <PermissionGate menuKey="staff" action="edit">
              <button
                type="button"
                className="text-xs text-blue-600"
                onClick={() => {
                  void (async () => {
                    try {
                      const r = await resetAdminStaffPassword(row.id)
                      if (r.temporaryPassword && r.email) {
                        setCreatedCred({ email: r.email, password: r.temporaryPassword })
                      }
                      showToast('임시 비밀번호가 재발급되었습니다.', 'success')
                    } catch (e) {
                      showToast(formatAdminPermissionError(e, '재발급 실패'), 'error')
                    }
                  })()
                }}
              >
                비밀번호
              </button>
            </PermissionGate>
            {row.isActive ? (
              <PermissionGate menuKey="staff" action="delete">
                <button
                  type="button"
                  className="text-xs text-amber-600"
                  onClick={() => {
                    void (async () => {
                      try {
                        await deactivateAdminStaff(row.id)
                        await load()
                      } catch (e) {
                        showToast(formatAdminPermissionError(e, '비활성화 실패'), 'error')
                      }
                    })()
                  }}
                >
                  정지
                </button>
              </PermissionGate>
            ) : (
              <PermissionGate menuKey="staff" action="edit">
                <button
                  type="button"
                  className="text-xs text-green-600"
                  onClick={() => {
                    void (async () => {
                      try {
                        await activateAdminStaff(row.id)
                        await load()
                      } catch (e) {
                        showToast(formatAdminPermissionError(e, '복구 실패'), 'error')
                      }
                    })()
                  }}
                >
                  복구
                </button>
              </PermissionGate>
            )}
            <PermissionGate menuKey="staff" action="delete">
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => setDeleteTarget(row)}
              >
                삭제
              </button>
            </PermissionGate>
          </div>
        ),
      })),
    [items, load, showToast],
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteAdminStaff(deleteTarget.id)
      setDeleteTarget(null)
      showToast('직원이 삭제되었습니다.', 'success')
      await load()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '삭제 실패'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) return
    if (form.role === 'PARTNER' && !form.distributorId) {
      showToast('총판 직원은 총판을 선택해야 합니다.', 'error')
      return
    }
    setSaving(true)
    try {
      const created = await createAdminStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        distributorId: form.role === 'PARTNER' ? Number(form.distributorId) : null,
      })
      setFormOpen(false)
      setForm({ name: '', email: '', role: 'ADMIN', distributorId: '' })
      if (created.temporaryPassword && created.email) {
        setCreatedCred({ email: created.email, password: created.temporaryPassword })
      }
      showToast('직원이 생성되었습니다.', 'success')
      await load()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '생성 실패'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="직원 계정"
        description="본사·총판 관리자 콘솔 계정"
        actions={
          <PermissionGate menuKey="staff" action="edit">
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
              onClick={() => setFormOpen(true)}
            >
              직원 추가
            </button>
          </PermissionGate>
        }
      />

      <div className="flex flex-wrap gap-2">
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="이름/이메일 검색"
          value={q}
          onChange={(e) => {
            setPage(1)
            setQ(e.target.value)
          }}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={role}
          onChange={(e) => {
            setPage(1)
            setRole(e.target.value)
          }}
        >
          <option value="all">전체 역할</option>
          {ADMIN_ROLES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <AdminTable
          loading={loading}
          columns={[
            { key: 'name', label: '이름' },
            { key: 'email', label: '이메일' },
            { key: 'roleLabel', label: '역할' },
            { key: 'org', label: '소속' },
            { key: 'status', label: '상태' },
            { key: 'lastLogin', label: '최근 로그인' },
            { key: 'actions', label: '관리' },
          ]}
          data={tableData}
        />
      </div>

      <div className="flex justify-end gap-2 text-sm">
        <button
          type="button"
          disabled={page <= 1}
          className="px-3 py-1 border rounded disabled:opacity-40"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          이전
        </button>
        <span className="px-2 py-1 text-gray-500">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          className="px-3 py-1 border rounded disabled:opacity-40"
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </button>
      </div>

      <AdminModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="직원 추가"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setFormOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
              onClick={() => void handleCreate()}
            >
              {saving ? '생성 중...' : '생성'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <label className="block space-y-1">
            <span>이름</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span>이메일</span>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span>역할</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {form.role === 'PARTNER' ? (
            <label className="block space-y-1">
              <span>총판</span>
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
          ) : null}
          <p className="text-xs text-gray-500">
            로그인 주소: /admin/login · 임시 비밀번호가 자동 발급됩니다.
          </p>
        </div>
      </AdminModal>

      <AdminModal open={!!createdCred} onClose={() => setCreatedCred(null)} title="임시 비밀번호" size="sm">
        {createdCred ? (
          <div className="space-y-2 text-sm">
            <p>이메일: {createdCred.email}</p>
            <p className="font-mono break-all">비밀번호: {createdCred.password}</p>
            <button
              type="button"
              className="text-blue-600 text-xs"
              onClick={() =>
                void navigator.clipboard.writeText(
                  `email=${createdCred.email}\npassword=${createdCred.password}\nurl=/admin/login`,
                )
              }
            >
              복사
            </button>
            <p className="text-xs text-amber-600">이 화면을 닫으면 비밀번호를 다시 조회할 수 없습니다.</p>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="직원 삭제"
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
          <strong>{deleteTarget?.name}</strong>({deleteTarget?.email}) 계정을 삭제할까요?
          삭제 후에는 로그인할 수 없으며, 목록에서도 사라집니다. 정지와 달리 복구할 수 없습니다.
        </p>
      </AdminModal>
    </div>
  )
}
