'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchBusinessMe, getMenusGrouped, type GroupedMenuItem } from '@/lib/store-api'
import { isDemoMode } from '@/lib/demo-mode'

const EMPTY_GROUPED: Record<string, GroupedMenuItem[]> = {}

function normalizeGroupedMenus(raw: Record<string, GroupedMenuItem[]>): Record<string, GroupedMenuItem[]> {
  const result: Record<string, GroupedMenuItem[]> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) result[key] = value
  }
  return result
}

export function useGroupedMenus(enabled: boolean) {
  const [groupedMenus, setGroupedMenus] = useState(EMPTY_GROUPED)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState('wash')

  useEffect(() => {
    if (!enabled || isDemoMode()) {
      setGroupedMenus(EMPTY_GROUPED)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchBusinessMe()
      .then((me) => {
        if (!cancelled && me.biz_type) setBusinessType(me.biz_type)
        return getMenusGrouped(me.id)
      })
      .then((grouped) => {
        if (!cancelled) setGroupedMenus(normalizeGroupedMenus(grouped))
      })
      .catch(() => {
        if (!cancelled) {
          setGroupedMenus(EMPTY_GROUPED)
          setError('그룹 메뉴 정보를 불러올 수 없습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  const categories = useMemo(
    () => Object.keys(groupedMenus).filter((k) => groupedMenus[k]?.length),
    [groupedMenus],
  )

  const useGrouped = categories.length > 0

  const refreshGrouped = async () => {
    const me = await fetchBusinessMe()
    const grouped = await getMenusGrouped(me.id)
    setGroupedMenus(normalizeGroupedMenus(grouped))
    setError(null)
  }

  return {
    groupedMenus,
    groupedCategories: categories,
    useGrouped,
    groupedLoading: loading,
    groupedError: error,
    businessType,
    refreshGrouped,
  }
}
