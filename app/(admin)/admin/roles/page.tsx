'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import { PermissionGate } from '@/components/admin/PermissionGate'
import { usePermission } from '@/hooks/useAdminPermissions'
import {
  fetchAdminRolePermissions,
  formatAdminPermissionError,
  saveRolePermissions,
  type AdminMenuPermissionRow,
  type AdminRolePermissions,
} from '@/lib/admin-api'
import {
  ADMIN_ROLES,
  EMPTY_PERM,
  normalizePermission,
  type AdminRoleKey,
  type MenuPermission,
  type PermissionKey,
} from '@/lib/admin-permissions'
import { ADMIN_MENU_REGISTRY } from '@/lib/admin-menu-registry'

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  view: '조회',
  edit: '수정',
  delete: '삭제',
  approve: '승인',
  download: '다운로드',
}

const PERMISSION_KEYS: PermissionKey[] = ['view', 'edit', 'delete', 'approve', 'download']

const ROLE_COLORS: Record<string, string> = {
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  green: 'bg-green-50 border-green-200 text-green-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  teal: 'bg-teal-50 border-teal-200 text-teal-800',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
}

function rowsToMap(rows: AdminMenuPermissionRow[]): Record<string, MenuPermission> {
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
  for (const m of ADMIN_MENU_REGISTRY) {
    if (!out[m.key]) out[m.key] = { ...EMPTY_PERM }
  }
  return out
}

function mapToRows(map: Record<string, MenuPermission>): AdminMenuPermissionRow[] {
  return ADMIN_MENU_REGISTRY.map((m) => {
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

export default function AdminRolesPage() {
  const { showToast, ToastComponent } = useToast()
  const [selectedRole, setSelectedRole] = useState<AdminRoleKey>('ADMIN')
  const [baseline, setBaseline] = useState<Record<string, Record<string, MenuPermission>>>({})
  const [permissions, setPermissions] = useState<Record<string, Record<string, MenuPermission>>>({})
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const roles = await fetchAdminRolePermissions()
      const next: Record<string, Record<string, MenuPermission>> = {}
      for (const r of roles as AdminRolePermissions[]) {
        next[r.role] = rowsToMap(r.permissions)
      }
      setBaseline(next)
      setPermissions(next)
    } catch (e) {
      showToast(formatAdminPermissionError(e, '권한을 불러오지 못했습니다.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  const { canEdit } = usePermission('permissions')
  const currentRole = ADMIN_ROLES.find((r) => r.key === selectedRole)
  const isFixed = currentRole?.fixed ?? false
  const readOnly = isFixed || !canEdit
  const currentPerms = permissions[selectedRole] ?? {}

  const dirty = useMemo(() => {
    return JSON.stringify(permissions[selectedRole]) !== JSON.stringify(baseline[selectedRole])
  }, [permissions, baseline, selectedRole])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const selectRole = (role: AdminRoleKey) => {
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
      await saveRolePermissions({
        role: selectedRole,
        permissions: mapToRows(currentPerms),
      })
      setBaseline((b) => ({ ...b, [selectedRole]: currentPerms }))
      showToast('권한이 저장되었습니다.', 'success')
      setConfirmOpen(false)
    } catch (e) {
      showToast(formatAdminPermissionError(e, '권한 저장에 실패했습니다.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const groups = useMemo(() => {
    const map = new Map<string, typeof ADMIN_MENU_REGISTRY>()
    for (const m of ADMIN_MENU_REGISTRY) {
      const list = map.get(m.group) ?? []
      list.push(m)
      map.set(m.group, list)
    }
    return Array.from(map.entries())
  }, [])

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="권한 관리"
        description="역할별 메뉴 접근 권한 설정 (API에 저장·적용)"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setPermissions((p) => ({ ...p, [selectedRole]: baseline[selectedRole] ?? {} }))
              }
              disabled={isFixed || !dirty}
              className="px-3 py-2 border rounded-lg text-sm disabled:opacity-40"
            >
              취소
            </button>
            <PermissionGate menuKey="permissions" action="edit">
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={isFixed || !dirty || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                저장{dirty ? ' *' : ''}
              </button>
            </PermissionGate>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : (
        <div className="flex gap-6">
          <div className="w-52 flex-shrink-0 space-y-2">
            {ADMIN_ROLES.map((role) => (
              <button
                key={role.key}
                type="button"
                onClick={() => selectRole(role.key)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  selectedRole === role.key
                    ? ROLE_COLORS[role.color]
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{role.label}</span>
                  {role.fixed && (
                    <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                      고정
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{role.key}</div>
              </button>
            ))}
          </div>

          <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">{currentRole?.label} 권한</h3>
              {isFixed && (
                <p className="text-xs text-gray-400 mt-0.5">
                  최고관리자 권한은 수정할 수 없습니다.
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-48">
                      그룹 / 메뉴
                    </th>
                    {PERMISSION_KEYS.map((key) => (
                      <th key={key} className="text-center px-3 py-3 text-xs font-medium text-gray-500">
                        {PERMISSION_LABELS[key]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map(([group, items]) => (
                    <Fragment key={group}>
                      <tr className="bg-gray-50/50">
                        <td colSpan={6} className="px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                          {group}
                        </td>
                      </tr>
                      {items.map((item) => {
                        const perm = currentPerms[item.key] ?? EMPTY_PERM
                        return (
                          <tr key={item.key} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 text-sm text-gray-700">
                              <span className="mr-2">{item.icon}</span>
                              {item.label}
                            </td>
                            {PERMISSION_KEYS.map((key) => (
                              <td key={key} className="text-center px-3 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={perm[key] ?? false}
                                  onChange={() => handleToggle(item.key, key)}
                                  disabled={readOnly}
                                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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

      <AdminModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="권한 저장"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-1.5 border rounded-lg text-sm" onClick={() => setConfirmOpen(false)}>
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
          {currentRole?.label} 권한을 저장하면 즉시 API·사이드바에 반영됩니다.
        </p>
      </AdminModal>
    </div>
  )
}
