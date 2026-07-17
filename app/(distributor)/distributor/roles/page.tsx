'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useDistributorPermissions } from '@/hooks/useDistributorPermissions'
import { PermissionGate } from '@/components/distributor/PermissionGate'
import {
  fetchDistributorRolePermissions,
  formatDistributorPermissionError,
  saveDistributorRolePermissions,
  type DistributorMenuPermissionRow,
  type DistributorRolePermissions,
} from '@/lib/distributor-api'
import { DISTRIBUTOR_MENU_REGISTRY } from '@/lib/distributor-menu-registry'

type PermissionKey = 'view' | 'edit' | 'delete' | 'approve' | 'download'

type MenuPermission = Record<PermissionKey, boolean>

const PERMISSION_KEYS: PermissionKey[] = ['view', 'edit', 'delete', 'approve', 'download']

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  view: '조회',
  edit: '수정',
  delete: '삭제',
  approve: '승인',
  download: '다운로드',
}

const EMPTY_PERM: MenuPermission = {
  view: false,
  edit: false,
  delete: false,
  approve: false,
  download: false,
}

const ROLE_ORDER = ['OWNER', 'OPERATIONS', 'SALES', 'FINANCE', 'VIEWER'] as const

function normalizePermission(p?: Partial<MenuPermission> | null): MenuPermission {
  return {
    view: Boolean(p?.view),
    edit: Boolean(p?.edit),
    delete: Boolean(p?.delete),
    approve: Boolean(p?.approve),
    download: Boolean(p?.download),
  }
}

function rowsToMap(rows: DistributorMenuPermissionRow[]): Record<string, MenuPermission> {
  const out: Record<string, MenuPermission> = {}
  for (const r of rows) {
    out[r.menuKey] = normalizePermission({
      view: r.canView,
      edit: r.canEdit,
      delete: r.canDelete,
      approve: r.canApprove,
      download: r.canDownload,
    })
  }
  for (const m of DISTRIBUTOR_MENU_REGISTRY) {
    if (!out[m.key]) out[m.key] = { ...EMPTY_PERM }
  }
  return out
}

function mapToRows(map: Record<string, MenuPermission>): DistributorMenuPermissionRow[] {
  return DISTRIBUTOR_MENU_REGISTRY.map((m) => {
    const p = normalizePermission(map[m.key])
    return {
      menuKey: m.key,
      canView: p.view,
      canEdit: p.edit,
      canDelete: p.delete,
      canApprove: p.approve,
      canDownload: p.download,
    }
  })
}

export default function DistributorRolesPage() {
  const { loaded, isOwner, refresh } = useDistributorPermissions()
  const [selectedRole, setSelectedRole] = useState<string>('OPERATIONS')
  const [baseline, setBaseline] = useState<Record<string, Record<string, MenuPermission>>>({})
  const [permissions, setPermissions] = useState<Record<string, Record<string, MenuPermission>>>({})
  const [roleMeta, setRoleMeta] = useState<Record<string, { label: string; isFixed: boolean }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const roles = await fetchDistributorRolePermissions()
      const next: Record<string, Record<string, MenuPermission>> = {}
      const meta: Record<string, { label: string; isFixed: boolean }> = {}
      for (const r of roles as DistributorRolePermissions[]) {
        next[r.role] = rowsToMap(r.permissions)
        meta[r.role] = { label: r.roleLabel, isFixed: r.isFixed }
      }
      setBaseline(next)
      setPermissions(next)
      setRoleMeta(meta)
    } catch (e) {
      setError(formatDistributorPermissionError(e, '권한을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loaded || !isOwner) return
    void load()
  }, [loaded, isOwner, load])

  const isFixed = Boolean(roleMeta[selectedRole]?.isFixed) || selectedRole === 'OWNER'
  const readOnly = isFixed || !isOwner
  const currentPerms = permissions[selectedRole] ?? {}

  const dirty = useMemo(() => {
    return JSON.stringify(permissions[selectedRole]) !== JSON.stringify(baseline[selectedRole])
  }, [permissions, baseline, selectedRole])

  const selectRole = (role: string) => {
    if (dirty && !window.confirm('저장하지 않은 변경이 있습니다. 역할을 전환할까요?')) return
    setSelectedRole(role)
  }

  const handleToggle = (menuKey: string, field: PermissionKey) => {
    if (readOnly) return
    setPermissions((prev) => {
      const cur = normalizePermission(prev[selectedRole]?.[menuKey])
      let next = { ...cur, [field]: !cur[field] }
      if (field === 'view' && !next.view) {
        next = { ...EMPTY_PERM }
      } else if (field !== 'view' && next[field]) {
        next.view = true
      }
      next = normalizePermission(next)
      return {
        ...prev,
        [selectedRole]: {
          ...prev[selectedRole],
          [menuKey]: next,
        },
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveDistributorRolePermissions({
        role: selectedRole,
        permissions: mapToRows(currentPerms),
      })
      setBaseline((b) => ({ ...b, [selectedRole]: currentPerms }))
      showToast('권한이 저장되었습니다.')
      setConfirmOpen(false)
      await refresh()
    } catch (e) {
      showToast(formatDistributorPermissionError(e, '권한 저장에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const groups = useMemo(() => {
    const map = new Map<string, typeof DISTRIBUTOR_MENU_REGISTRY>()
    for (const m of DISTRIBUTOR_MENU_REGISTRY) {
      const list = map.get(m.group) ?? []
      list.push(m)
      map.set(m.group, list)
    }
    return Array.from(map.entries())
  }, [])

  const roles = ROLE_ORDER.filter((r) => roleMeta[r] || permissions[r])

  if (!loaded) {
    return <p className="p-6 text-sm text-stone-400">권한 확인 중...</p>
  }

  if (!isOwner) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-stone-900">권한관리</h1>
        <p className="mt-2 text-sm text-stone-500">권한 설정은 총판 대표만 가능합니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">권한관리</h1>
          <p className="mt-1 text-sm text-stone-500">
            총판 직원 역할별 메뉴·액션 권한을 설정합니다. (Admin 권한관리와 별도)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setPermissions((p) => ({ ...p, [selectedRole]: baseline[selectedRole] ?? {} }))
            }
            disabled={isFixed || !dirty}
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
          >
            취소
          </button>
          <PermissionGate menuKey="roles" action="edit">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isFixed || !dirty || saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              저장{dirty ? ' *' : ''}
            </button>
          </PermissionGate>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-stone-400">불러오는 중...</p>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full space-y-2 lg:w-52 lg:flex-shrink-0">
            {roles.map((role) => {
              const meta = roleMeta[role]
              const active = selectedRole === role
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => selectRole(role)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                    active
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{meta?.label ?? role}</span>
                    {meta?.isFixed && (
                      <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] text-indigo-700">
                        고정
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[10px] text-stone-400">{role}</div>
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-6 py-4">
              <h3 className="text-sm font-semibold text-stone-900">
                {roleMeta[selectedRole]?.label ?? selectedRole} 권한
              </h3>
              {isFixed && (
                <p className="mt-0.5 text-xs text-stone-400">
                  총판 대표 권한은 수정할 수 없습니다.
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="w-48 px-4 py-3 text-left text-xs font-medium text-stone-500">
                      그룹 / 메뉴
                    </th>
                    {PERMISSION_KEYS.map((key) => (
                      <th key={key} className="px-3 py-3 text-center text-xs font-medium text-stone-500">
                        {PERMISSION_LABELS[key]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map(([group, items]) => (
                    <Fragment key={group}>
                      <tr className="bg-stone-50/50">
                        <td
                          colSpan={6}
                          className="px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-stone-400"
                        >
                          {group}
                        </td>
                      </tr>
                      {items.map((item) => {
                        const perm = currentPerms[item.key] ?? EMPTY_PERM
                        return (
                          <tr key={item.key} className="border-b border-stone-50 hover:bg-stone-50/50">
                            <td className="px-4 py-2.5 text-sm text-stone-700">
                              <span className="mr-2">{item.icon}</span>
                              {item.label}
                            </td>
                            {PERMISSION_KEYS.map((key) => (
                              <td key={key} className="px-3 py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm[key] ?? false}
                                  onChange={() => handleToggle(item.key, key)}
                                  disabled={readOnly}
                                  className="h-4 w-4 cursor-pointer rounded accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-stone-900">권한 저장</h2>
            <p className="mt-2 text-sm text-stone-600">
              {roleMeta[selectedRole]?.label ?? selectedRole} 권한을 저장하면 해당 역할 직원에게 즉시
              반영됩니다.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border px-3 py-1.5 text-sm"
                onClick={() => setConfirmOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
                onClick={() => void handleSave()}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
