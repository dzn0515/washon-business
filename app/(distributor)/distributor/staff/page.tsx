'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDistributorPermissions } from '@/hooks/useDistributorPermissions'
import { PermissionGate } from '@/components/distributor/PermissionGate'
import {
  activateDistributorStaff,
  createDistributorStaff,
  deactivateDistributorStaff,
  DISTRIBUTOR_STAFF_ROLES,
  DISTRIBUTOR_STAFF_ROLE_LABELS,
  formatDistributorPermissionError,
  listDistributorStaff,
  resetDistributorStaffPassword,
  type DistributorStaffItem,
} from '@/lib/distributor-api'

const PAGE_SIZE = 20

export default function DistributorStaffPage() {
  const { loaded, isOwner } = useDistributorPermissions()
  const [items, setItems] = useState<DistributorStaffItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [qInput, setQInput] = useState('')
  const [role, setRole] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', staffRole: 'OPERATIONS' })
  const [createdCred, setCreatedCred] = useState<{ email: string; password: string } | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listDistributorStaff({
        q: q || undefined,
        role: role === 'all' ? undefined : role,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (e) {
      setError(formatDistributorPermissionError(e, '직원 목록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [q, role, statusFilter, page])

  useEffect(() => {
    if (!loaded || !isOwner) return
    void load()
  }, [loaded, isOwner, load])

  const tableRows = useMemo(() => items, [items])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast('이름과 이메일을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      const created = await createDistributorStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        staffRole: form.staffRole,
      })
      setFormOpen(false)
      setForm({ name: '', email: '', staffRole: 'OPERATIONS' })
      if (created.temporaryPassword && created.email) {
        setCreatedCred({ email: created.email, password: created.temporaryPassword })
      }
      showToast('직원이 생성되었습니다.')
      await load()
    } catch (e) {
      showToast(formatDistributorPermissionError(e, '직원 생성에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (row: DistributorStaffItem) => {
    try {
      if (row.isActive) {
        await deactivateDistributorStaff(row.id)
        showToast('직원 계정을 비활성화했습니다.')
      } else {
        await activateDistributorStaff(row.id)
        showToast('직원 계정을 활성화했습니다.')
      }
      await load()
    } catch (e) {
      showToast(formatDistributorPermissionError(e, '처리에 실패했습니다.'))
    }
  }

  const handleResetPassword = async (row: DistributorStaffItem) => {
    try {
      const r = await resetDistributorStaffPassword(row.id)
      if (r.temporaryPassword && r.email) {
        setCreatedCred({ email: r.email, password: r.temporaryPassword })
      }
      showToast('임시 비밀번호가 재발급되었습니다.')
    } catch (e) {
      showToast(formatDistributorPermissionError(e, '비밀번호 재발급에 실패했습니다.'))
    }
  }

  if (!loaded) {
    return <p className="text-sm text-stone-400">권한 확인 중...</p>
  }

  if (!isOwner) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-xl border border-stone-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-stone-900">접근 권한이 없습니다</p>
          <p className="mt-2 text-sm text-stone-500">직원관리는 대표 계정만 이용할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">직원관리</h1>
          <p className="mt-1 text-sm text-stone-500">총판 포털에 접속할 직원 계정을 관리합니다.</p>
        </div>
        <PermissionGate menuKey="staff" action="edit">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            직원 추가
          </button>
        </PermissionGate>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setQ(qInput.trim())
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="이름·이메일 검색"
          className="min-w-[180px] flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={role}
          onChange={(e) => {
            setPage(1)
            setRole(e.target.value)
          }}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="all">전체 역할</option>
          <option value="OWNER">대표</option>
          {DISTRIBUTOR_STAFF_ROLES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1)
            setStatusFilter(e.target.value)
          }}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="all">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">비활성</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        >
          검색
        </button>
      </form>

      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">이메일</th>
              <th className="px-4 py-3 font-medium">역할</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">최근 로그인</th>
              <th className="px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-stone-400">
                  불러오는 중...
                </td>
              </tr>
            ) : tableRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-stone-400">
                  직원이 없습니다.
                </td>
              </tr>
            ) : (
              tableRows.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50/80">
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {row.name}
                    {row.isOwner ? (
                      <span className="ml-1.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700">
                        대표
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{row.email ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {DISTRIBUTOR_STAFF_ROLE_LABELS[row.staffRole] ?? row.staffRoleLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.isActive
                          ? 'rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700'
                          : 'rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-500'
                      }
                    >
                      {row.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <PermissionGate menuKey="staff" action="edit">
                        <button
                          type="button"
                          className="text-xs font-medium text-blue-600 hover:underline"
                          onClick={() => void handleResetPassword(row)}
                        >
                          비밀번호 재발급
                        </button>
                      </PermissionGate>
                      {!row.isOwner ? (
                        <PermissionGate menuKey="staff" action={row.isActive ? 'delete' : 'edit'}>
                          <button
                            type="button"
                            className={
                              row.isActive
                                ? 'text-xs font-medium text-red-600 hover:underline'
                                : 'text-xs font-medium text-emerald-600 hover:underline'
                            }
                            onClick={() => void handleToggleActive(row)}
                          >
                            {row.isActive ? '비활성화' : '활성화'}
                          </button>
                        </PermissionGate>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>
          총 {total}건 · {page}/{Math.max(totalPages, 1)} 페이지
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-stone-200 px-3 py-1.5 disabled:opacity-40"
          >
            이전
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-stone-900">직원 추가</h2>
            <div className="mt-4 space-y-3 text-sm">
              <label className="block space-y-1">
                <span className="text-stone-600">이름</span>
                <input
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-stone-600">이메일</span>
                <input
                  type="email"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-stone-600">역할</span>
                <select
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  value={form.staffRole}
                  onChange={(e) => setForm((f) => ({ ...f, staffRole: e.target.value }))}
                >
                  {DISTRIBUTOR_STAFF_ROLES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-stone-400">
                로그인 주소: /distributor/login · 임시 비밀번호가 자동 발급됩니다.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
                onClick={() => setFormOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                onClick={() => void handleCreate()}
              >
                {saving ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {createdCred ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-stone-900">임시 비밀번호</h2>
            <div className="mt-3 space-y-1 text-sm">
              <p className="text-stone-600">이메일: {createdCred.email}</p>
              <p className="font-mono break-all text-stone-900">비밀번호: {createdCred.password}</p>
              <p className="mt-2 text-xs text-amber-600">이 화면을 닫으면 비밀번호를 다시 조회할 수 없습니다.</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
                onClick={() =>
                  void navigator.clipboard.writeText(
                    `email=${createdCred.email}\npassword=${createdCred.password}\nurl=/distributor/login`,
                  )
                }
              >
                복사
              </button>
              <button
                type="button"
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white"
                onClick={() => setCreatedCred(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
