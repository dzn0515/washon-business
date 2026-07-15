'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMyAdminPermissions, type AdminMyPermissions } from '@/lib/admin-api'
import type { PermissionKey } from '@/lib/admin-permissions'
import { ADMIN_MENU_REGISTRY, menuKeyForPath } from '@/lib/admin-menu-registry'

type PermFlags = {
  view: boolean
  edit: boolean
  delete: boolean
  approve: boolean
  download: boolean
}

type PermissionContextValue = {
  loaded: boolean
  role: string | null
  distributorId: string | null
  passwordResetRequired: boolean
  canView: (menuKey: string) => boolean
  can: (menuKey: string, action: PermissionKey) => boolean
  refresh: () => Promise<void>
  firstAllowedHref: string | null
}

const PermissionContext = createContext<PermissionContextValue | null>(null)

const ALL_TRUE: PermFlags = {
  view: true,
  edit: true,
  delete: true,
  approve: true,
  download: true,
}

export function AdminPermissionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminMyPermissions | null>(null)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetchMyAdminPermissions()
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const map = useMemo(() => {
    const out = new Map<string, PermFlags>()
    if (!data) return out
    if (data.role?.toUpperCase() === 'SUPER_ADMIN') {
      return out // empty map → treat as all true below
    }
    for (const p of data.permissions) {
      out.set(p.menuKey, {
        view: p.canView,
        edit: p.canEdit,
        delete: p.canDelete,
        approve: p.canApprove,
        download: p.canDownload,
      })
    }
    return out
  }, [data])

  const isSuper = data?.role?.toUpperCase() === 'SUPER_ADMIN'

  const can = useCallback(
    (menuKey: string, action: PermissionKey) => {
      if (!loaded) return false
      if (isSuper) return true
      const flags = map.get(menuKey)
      if (!flags) return false
      return Boolean(flags[action])
    },
    [loaded, isSuper, map],
  )

  const canView = useCallback((menuKey: string) => can(menuKey, 'view'), [can])

  const firstAllowedHref = useMemo(() => {
    if (!loaded) return null
    if (isSuper) return '/admin/dashboard'
    for (const m of ADMIN_MENU_REGISTRY) {
      if (map.get(m.key)?.view) return m.href
    }
    return null
  }, [loaded, isSuper, map])

  const value: PermissionContextValue = {
    loaded,
    role: data?.role ?? null,
    distributorId: data?.distributorId ?? null,
    passwordResetRequired: Boolean(data?.passwordResetRequired),
    canView,
    can,
    refresh,
    firstAllowedHref,
  }

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermissionMap() {
  const ctx = useContext(PermissionContext)
  if (!ctx) {
    return {
      loaded: false,
      role: null,
      distributorId: null,
      passwordResetRequired: false,
      canView: () => true,
      can: () => true,
      refresh: async () => undefined,
      firstAllowedHref: '/admin/dashboard',
    } satisfies PermissionContextValue
  }
  return ctx
}

export function usePermission(menuKey?: string | null) {
  const { can, canView, loaded, role } = usePermissionMap()
  const key = menuKey ?? null
  return {
    loaded,
    role,
    canView: key ? canView(key) : false,
    canEdit: key ? can(key, 'edit') : false,
    canDelete: key ? can(key, 'delete') : false,
    canApprove: key ? can(key, 'approve') : false,
    canDownload: key ? can(key, 'download') : false,
    can: (action: PermissionKey) => (key ? can(key, action) : false),
  }
}

export function usePathPermission() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  // Prefer caller to pass pathname; this helper is for client components with usePathname
  return usePermission(menuKeyForPath(pathname))
}

export { ALL_TRUE }
