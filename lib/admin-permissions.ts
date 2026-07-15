import { ADMIN_MENU_REGISTRY } from '@/lib/admin-menu-registry'

export type PermissionKey = 'view' | 'edit' | 'delete' | 'approve' | 'download'

export interface MenuPermission {
  view: boolean
  edit: boolean
  delete: boolean
  approve: boolean
  download: boolean
}

export type RolePermissionMap = Record<string, MenuPermission>

export const ADMIN_ROLES = [
  { key: 'SUPER_ADMIN', label: '최고관리자', color: 'purple', fixed: true },
  { key: 'ADMIN', label: '운영관리자', color: 'blue', fixed: false },
  { key: 'FINANCE', label: '정산관리자', color: 'green', fixed: false },
  { key: 'CS', label: 'CS관리자', color: 'orange', fixed: false },
  { key: 'SALES', label: '영업관리자', color: 'indigo', fixed: false },
  { key: 'PARTNER', label: '총판관리자', color: 'teal', fixed: false },
  { key: 'VIEWER', label: '읽기전용', color: 'gray', fixed: false },
] as const

export type AdminRoleKey = (typeof ADMIN_ROLES)[number]['key']

export const ADMIN_CONSOLE_ROLES = ADMIN_ROLES.map((r) => r.key)

export const ALL_MENU_KEYS = ADMIN_MENU_REGISTRY.map((m) => m.key)

export const EMPTY_PERM: MenuPermission = {
  view: false,
  edit: false,
  delete: false,
  approve: false,
  download: false,
}

export function normalizePermission(p: Partial<MenuPermission> | null | undefined): MenuPermission {
  const view = Boolean(p?.view)
  if (!view) return { ...EMPTY_PERM }
  return {
    view: true,
    edit: Boolean(p?.edit),
    delete: Boolean(p?.delete),
    approve: Boolean(p?.approve),
    download: Boolean(p?.download),
  }
}

/** Legacy FE keys (read/update) → new action keys */
export function fromLegacyPermission(raw: Record<string, boolean>): MenuPermission {
  if ('view' in raw || 'edit' in raw) {
    return normalizePermission({
      view: raw.view ?? raw.read,
      edit: raw.edit ?? raw.update,
      delete: raw.delete,
      approve: raw.approve,
      download: raw.download,
    })
  }
  return normalizePermission({
    view: raw.read,
    edit: raw.update,
    delete: raw.delete,
    approve: raw.approve,
    download: raw.download,
  })
}
