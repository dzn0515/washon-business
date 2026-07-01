'use client'

import { Fragment, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import { saveRolePermissions } from '@/lib/admin-api'
import {
  ADMIN_ROLES,
  DEFAULT_PERMISSIONS,
  type AdminRoleKey,
  type PermissionKey,
  type RolePermissionMap,
} from '@/lib/admin-permissions'
import { ADMIN_MENUS } from '@/components/admin/AdminSidebar'

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  read: '조회',
  update: '수정',
  delete: '삭제',
  approve: '승인',
  download: '다운로드',
}

const PERMISSION_KEYS: PermissionKey[] = ['read', 'update', 'delete', 'approve', 'download']

const ROLE_COLORS: Record<string, string> = {
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  green: 'bg-green-50 border-green-200 text-green-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  teal: 'bg-teal-50 border-teal-200 text-teal-800',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
}

const EMPTY_PERM = {
  read: false,
  update: false,
  delete: false,
  approve: false,
  download: false,
}

export default function AdminRolesPage() {
  const { showToast, ToastComponent } = useToast()
  const [selectedRole, setSelectedRole] = useState<AdminRoleKey>('ADMIN')
  const [permissions, setPermissions] = useState<Record<AdminRoleKey, RolePermissionMap>>(
    DEFAULT_PERMISSIONS,
  )
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const currentRole = ADMIN_ROLES.find((r) => r.key === selectedRole)
  const isFixed = currentRole?.fixed ?? false
  const currentPerms = permissions[selectedRole] ?? {}

  const handleToggle = (permKey: string, field: PermissionKey) => {
    if (isFixed) return
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [permKey]: {
          ...(prev[selectedRole]?.[permKey] ?? EMPTY_PERM),
          [field]: !(prev[selectedRole]?.[permKey]?.[field] ?? false),
        },
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveRolePermissions({
        role: selectedRole,
        permissions: currentPerms,
      })
      showToast('권한이 저장되었습니다.', 'success')
      setConfirmOpen(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '권한 저장에 실패했습니다.'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="권한 관리"
        description="역할별 메뉴 접근 권한 설정"
        actions={
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isFixed}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            저장
          </button>
        }
      />

      <div className="flex gap-6">
        <div className="w-52 flex-shrink-0 space-y-2">
          {ADMIN_ROLES.map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => setSelectedRole(role.key)}
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-48">
                    그룹 / 메뉴
                  </th>
                  {PERMISSION_KEYS.map((key) => (
                    <th
                      key={key}
                      className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide"
                    >
                      {PERMISSION_LABELS[key]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ADMIN_MENUS.map((section) => (
                  <Fragment key={section.group}>
                    <tr className="bg-gray-50/50">
                      <td
                        colSpan={6}
                        className="px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-gray-400"
                      >
                        {section.group}
                      </td>
                    </tr>
                    {section.items.map((item) => {
                      const perm = currentPerms[item.permission] ?? EMPTY_PERM
                      return (
                        <tr
                          key={item.permission}
                          className="border-b border-gray-50 hover:bg-gray-50/50"
                        >
                          <td className="px-4 py-2.5 text-sm text-gray-700">
                            <span className="mr-2">{item.icon}</span>
                            {item.label}
                          </td>
                          {PERMISSION_KEYS.map((key) => (
                            <td key={key} className="text-center px-3 py-2.5">
                              <input
                                type="checkbox"
                                checked={perm[key] ?? false}
                                onChange={() => handleToggle(item.permission, key)}
                                disabled={isFixed}
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

      <AdminModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="권한 저장"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '확인'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          <strong>{currentRole?.label}</strong> 역할의 권한을 저장합니다. 계속하시겠습니까?
        </p>
      </AdminModal>
    </div>
  )
}
