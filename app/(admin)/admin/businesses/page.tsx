'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import { PermissionGate } from '@/components/admin/PermissionGate'
import { usePermission } from '@/hooks/useAdminPermissions'
import {
  attachAdminPartnerTag,
  bulkAdminPartnerAssignment,
  bulkAdminPartnerTags,
  createAdminPartnerMemo,
  createAdminPartnerSavedFilter,
  deleteAdminPartnerMemo,
  deleteAdminPartnerSavedFilter,
  detachAdminPartnerTag,
  exportAdminPartnersCsv,
  fetchAdminAllBusinesses,
  fetchAdminPartnerDeletionImpact,
  fetchAdminPartnerDetail,
  fetchAdminPartnerSavedFilters,
  fetchAdminPartnerTags,
  fetchAdminSalesAgents,
  formatAdminPermissionError,
  previewAdminPartnersBulk,
  setDefaultAdminPartnerSavedFilter,
  softDeleteAdminPartner,
  undeleteAdminPartner,
  updateAdminPartnerMemo,
  updateBusinessStatus,
  type AdminPartnerBulkPreview,
  type AdminPartnerDeletionImpact,
  type AdminPartnerDetail,
  type AdminPartnerListItem,
  type AdminPartnerMemoItem,
  type AdminPartnerSummary,
  type AdminPartnerTagItem,
  type AdminSavedPartnerFilter,
  type AdminSalesAgent,
  type PartnerSelectionPayload,
} from '@/lib/admin-api'
import {
  ADMIN_BIZ_TYPE_FILTERS,
  BUSINESS_STATUS_LABEL,
  BUSINESS_STATUS_VARIANT,
  getAdminBizTypeLabel,
  type AdminBizTypeFilterKey,
} from '@/lib/admin-ui'

type KpiKey =
  | 'all'
  | 'pending'
  | 'active'
  | 'suspended'
  | 'setup_incomplete'
  | 'stale_login'
  | 'unpaid'
  | 'deleted'

const KPI_CARDS: {
  key: KpiKey
  label: string
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  summaryKey: keyof AdminPartnerSummary
}[] = [
  { key: 'all', label: '전체 업체', color: 'blue', summaryKey: 'total' },
  { key: 'pending', label: '승인대기', color: 'orange', summaryKey: 'pending' },
  { key: 'active', label: '운영중', color: 'green', summaryKey: 'active' },
  { key: 'suspended', label: '정지', color: 'red', summaryKey: 'suspended' },
  { key: 'setup_incomplete', label: '설정 미완료', color: 'purple', summaryKey: 'setup_incomplete' },
  { key: 'stale_login', label: '장기 미접속', color: 'orange', summaryKey: 'stale_login' },
  { key: 'unpaid', label: '미납', color: 'red', summaryKey: 'unpaid' },
  { key: 'deleted', label: '삭제', color: 'purple', summaryKey: 'deleted' },
]

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: '가입일 ↓' },
  { value: 'created_at:asc', label: '가입일 ↑' },
  { value: 'last_login:desc', label: '최근 로그인 ↓' },
  { value: 'last_login:asc', label: '최근 로그인 ↑' },
  { value: 'recent_reservations:desc', label: '최근 예약 ↓' },
  { value: 'business_name:asc', label: '업체명 ↑' },
  { value: 'plan:asc', label: '플랜 ↑' },
  { value: 'region:asc', label: '지역 ↑' },
]

const PAGE_SIZE_OPTIONS = [30, 50, 100]

type ConfirmAction = {
  business: AdminPartnerListItem
  title: string
  message: string
  nextStatus: string
  variant: 'danger' | 'primary'
  needsReason?: boolean
}

function readParam(params: URLSearchParams, key: string, fallback = '') {
  return params.get(key) ?? fallback
}

function readTagIds(params: URLSearchParams): string[] {
  const multi = params.getAll('tags')
  if (multi.length) {
    return multi
      .flatMap((v) => v.split(','))
      .map((v) => v.trim())
      .filter(Boolean)
  }
  const raw = params.get('tags')
  if (!raw) return []
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function formatMemoTime(value: string | null | undefined) {
  if (!value) return '-'
  return value.slice(0, 19).replace('T', ' ')
}

export default function AdminBusinessesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast, ToastComponent } = useToast()
  const { can: canBusiness } = usePermission('businesses')
  const { can: canAssignment } = usePermission('sales_assignments')

  const [kpi, setKpi] = useState<KpiKey>((readParam(searchParams, 'kpi', 'all') as KpiKey) || 'all')
  const [bizType, setBizType] = useState<AdminBizTypeFilterKey>(
    (readParam(searchParams, 'biz_type', 'all') as AdminBizTypeFilterKey) || 'all',
  )
  const [planTier, setPlanTier] = useState(readParam(searchParams, 'plan_tier', 'all'))
  const [coords, setCoords] = useState(readParam(searchParams, 'coords', 'all'))
  const [sort, setSort] = useState(readParam(searchParams, 'sort', 'created_at:desc'))
  const [search, setSearch] = useState(readParam(searchParams, 'q'))
  const [searchInput, setSearchInput] = useState(readParam(searchParams, 'q'))
  const [page, setPage] = useState(Number(readParam(searchParams, 'page', '1')) || 1)
  const [pageSize, setPageSize] = useState(Number(readParam(searchParams, 'page_size', '30')) || 30)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => readTagIds(searchParams))
  const [tagCatalog, setTagCatalog] = useState<AdminPartnerTagItem[]>([])
  const [businesses, setBusinesses] = useState<AdminPartnerListItem[]>([])
  const [summary, setSummary] = useState<AdminPartnerSummary | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [drawer, setDrawer] = useState<AdminPartnerDetail | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [memoDraft, setMemoDraft] = useState('')
  const [memoPinned, setMemoPinned] = useState(false)
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [memoSaving, setMemoSaving] = useState(false)
  const [tagSaving, setTagSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminPartnerListItem | null>(null)
  const [deleteImpact, setDeleteImpact] = useState<AdminPartnerDeletionImpact | null>(null)
  const [deleteImpactLoading, setDeleteImpactLoading] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [undeleteTarget, setUndeleteTarget] = useState<AdminPartnerListItem | null>(null)
  const [undeleteReason, setUndeleteReason] = useState('')
  const [undeleteConfirmChecked, setUndeleteConfirmChecked] = useState(false)

  const [savedFilters, setSavedFilters] = useState<AdminSavedPartnerFilter[]>([])
  const [saveFilterName, setSaveFilterName] = useState('')
  const [saveFilterOpen, setSaveFilterOpen] = useState(false)
  const [savedFilterBusy, setSavedFilterBusy] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [filterSelectAll, setFilterSelectAll] = useState(false)
  const [bulkMode, setBulkMode] = useState<'tags' | 'assignment' | null>(null)
  const [bulkTagAction, setBulkTagAction] = useState<'ADD' | 'REMOVE'>('ADD')
  const [bulkTagIds, setBulkTagIds] = useState<string[]>([])
  const [bulkAgentId, setBulkAgentId] = useState('')
  const [bulkAssignAction, setBulkAssignAction] = useState<'ASSIGN' | 'UNASSIGN'>('ASSIGN')
  const [bulkReason, setBulkReason] = useState('')
  const [bulkPreview, setBulkPreview] = useState<AdminPartnerBulkPreview | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkResultText, setBulkResultText] = useState('')
  const [agents, setAgents] = useState<AdminSalesAgent[]>([])
  const [csvBusy, setCsvBusy] = useState(false)

  const isDeletedVault = kpi === 'deleted'
  const canEditOps = canBusiness('edit')
  const canDownload = canBusiness('download')
  const canEditAssignment = canAssignment('edit')

  const currentFilters = useMemo((): Record<string, unknown> => {
    const filters: Record<string, unknown> = {
      keyword: search || undefined,
      bizType: bizType !== 'all' ? bizType : undefined,
      planTier: planTier !== 'all' ? planTier : undefined,
      hasCoordinates: coords === 'yes' ? true : coords === 'no' ? false : undefined,
      kpi: kpi !== 'all' ? kpi : undefined,
      deleted: kpi === 'deleted' ? 'only' : 'exclude',
      sort,
      pageSize,
      tagIds: selectedTagIds.length ? selectedTagIds.map((id) => Number(id)) : undefined,
    }
    return Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'),
    )
  }, [search, bizType, planTier, coords, kpi, sort, pageSize, selectedTagIds])

  const selectionPayload = useCallback((): PartnerSelectionPayload => {
    if (filterSelectAll) {
      return { mode: 'FILTER', filters: currentFilters, excluded_partner_ids: [] }
    }
    return {
      mode: 'IDS',
      partner_ids: Array.from(selectedIds).map((id) => Number(id)),
    }
  }, [filterSelectAll, currentFilters, selectedIds])

  const selectionCount = filterSelectAll ? total : selectedIds.size

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setFilterSelectAll(false)
  }, [])

  const loadSavedFilters = useCallback(async () => {
    try {
      setSavedFilters(await fetchAdminPartnerSavedFilters())
    } catch {
      setSavedFilters([])
    }
  }, [])

  useEffect(() => {
    void loadSavedFilters()
  }, [loadSavedFilters])

  useEffect(() => {
    clearSelection()
  }, [kpi, bizType, planTier, coords, sort, search, selectedTagIds, clearSelection])

  const syncUrl = useCallback(
    (next: Record<string, string | number | undefined>) => {
      const qs = new URLSearchParams()
      Object.entries(next).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all') return
        if (key === 'page' && Number(value) === 1) return
        if (key === 'page_size' && Number(value) === 30) return
        if (key === 'sort' && value === 'created_at:desc') return
        qs.set(key, String(value))
      })
      const path = qs.toString() ? `/admin/businesses?${qs}` : '/admin/businesses'
      router.replace(path, { scroll: false })
    },
    [router],
  )

  useEffect(() => {
    syncUrl({
      kpi,
      biz_type: bizType,
      plan_tier: planTier,
      coords,
      sort,
      q: search,
      page,
      page_size: pageSize,
      tags: selectedTagIds.length ? selectedTagIds.join(',') : undefined,
    })
  }, [kpi, bizType, planTier, coords, sort, search, page, pageSize, selectedTagIds, syncUrl])

  useEffect(() => {
    void fetchAdminPartnerTags()
      .then(setTagCatalog)
      .catch(() => setTagCatalog([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdminAllBusinesses({
        search,
        bizType,
        planTier,
        page,
        pageSize,
        sort,
        kpi: kpi === 'all' ? undefined : kpi,
        deleted: kpi === 'deleted' ? 'only' : 'exclude',
        hasCoordinates: coords === 'yes' ? true : coords === 'no' ? false : null,
        includeSummary: true,
        tagIds: selectedTagIds,
      })
      setBusinesses(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setSummary(data.summary)
    } catch {
      setError(true)
      setBusinesses([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [search, bizType, planTier, page, pageSize, sort, kpi, coords, selectedTagIds])

  useEffect(() => {
    void load()
  }, [load])

  const openDrawer = async (id: string) => {
    setDrawerLoading(true)
    setMemoDraft('')
    setMemoPinned(false)
    setEditingMemoId(null)
    try {
      const detail = await fetchAdminPartnerDetail(id)
      setDrawer(detail)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '상세 정보를 불러오지 못했습니다.', 'error')
    } finally {
      setDrawerLoading(false)
    }
  }

  const refreshDrawer = async (id: string) => {
    const detail = await fetchAdminPartnerDetail(id)
    setDrawer(detail)
  }

  const handleSaveMemo = async () => {
    if (!drawer || !memoDraft.trim()) return
    setMemoSaving(true)
    try {
      if (editingMemoId) {
        await updateAdminPartnerMemo(drawer.id, editingMemoId, {
          content: memoDraft.trim(),
          is_pinned: memoPinned,
        })
        showToast('메모를 수정했습니다.', 'success')
      } else {
        await createAdminPartnerMemo(drawer.id, {
          content: memoDraft.trim(),
          is_pinned: memoPinned,
        })
        showToast('메모를 등록했습니다.', 'success')
      }
      setMemoDraft('')
      setMemoPinned(false)
      setEditingMemoId(null)
      await refreshDrawer(drawer.id)
      void load()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '메모 저장에 실패했습니다.'), 'error')
    } finally {
      setMemoSaving(false)
    }
  }

  const handleEditMemo = (memo: AdminPartnerMemoItem) => {
    setEditingMemoId(memo.id)
    setMemoDraft(memo.content)
    setMemoPinned(memo.is_pinned)
  }

  const handleDeleteMemo = async (memoId: string) => {
    if (!drawer) return
    if (!window.confirm('이 메모를 삭제할까요?')) return
    setMemoSaving(true)
    try {
      await deleteAdminPartnerMemo(drawer.id, memoId)
      showToast('메모를 삭제했습니다.', 'success')
      if (editingMemoId === memoId) {
        setEditingMemoId(null)
        setMemoDraft('')
        setMemoPinned(false)
      }
      await refreshDrawer(drawer.id)
      void load()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '메모 삭제에 실패했습니다.'), 'error')
    } finally {
      setMemoSaving(false)
    }
  }

  const handleTogglePin = async (memo: AdminPartnerMemoItem) => {
    if (!drawer) return
    setMemoSaving(true)
    try {
      await updateAdminPartnerMemo(drawer.id, memo.id, { is_pinned: !memo.is_pinned })
      await refreshDrawer(drawer.id)
    } catch (e) {
      showToast(formatAdminPermissionError(e, '핀 변경에 실패했습니다.'), 'error')
    } finally {
      setMemoSaving(false)
    }
  }

  const handleAttachTag = async (tagId: string) => {
    if (!drawer) return
    setTagSaving(true)
    try {
      const tags = await attachAdminPartnerTag(drawer.id, tagId)
      setDrawer({ ...drawer, tags })
      void load()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '태그 추가에 실패했습니다.'), 'error')
    } finally {
      setTagSaving(false)
    }
  }

  const handleDetachTag = async (tagId: string) => {
    if (!drawer) return
    setTagSaving(true)
    try {
      const tags = await detachAdminPartnerTag(drawer.id, tagId)
      setDrawer({ ...drawer, tags })
      void load()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '태그 제거에 실패했습니다.'), 'error')
    } finally {
      setTagSaving(false)
    }
  }

  const toggleTagFilter = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
    setPage(1)
  }

  const handleStatusAction = async () => {
    if (!confirm) return
    if (confirm.needsReason && !rejectReason.trim()) return
    setActionLoading(true)
    try {
      await updateBusinessStatus(
        confirm.business.id,
        confirm.nextStatus,
        confirm.needsReason ? rejectReason : undefined,
        confirm.business.status,
      )
      showToast('상태가 변경되었습니다.', 'success')
      setConfirm(null)
      setRejectReason('')
      setDrawer(null)
      void load()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '상태 변경에 실패했습니다.'), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const selectedBusiness = useMemo(
    () => (drawer ? businesses.find((b) => b.id === drawer.id) : null),
    [drawer, businesses],
  )

  const openDeleteModal = async (business: AdminPartnerListItem) => {
    setDeleteTarget(business)
    setDeleteImpact(null)
    setDeleteReason('')
    setDeleteConfirmChecked(false)
    setDeleteConfirmText('')
    setDeleteImpactLoading(true)
    try {
      const impact = await fetchAdminPartnerDeletionImpact(business.id)
      setDeleteImpact(impact)
    } catch (e) {
      showToast(formatAdminPermissionError(e, '삭제 영향도를 불러오지 못했습니다.'), 'error')
      setDeleteTarget(null)
    } finally {
      setDeleteImpactLoading(false)
    }
  }

  const handleSoftDelete = async () => {
    if (!deleteTarget || !deleteImpact?.can_delete) return
    if (!deleteConfirmChecked || deleteConfirmText.trim() !== '업체삭제' || !deleteReason.trim()) {
      return
    }
    setActionLoading(true)
    try {
      await softDeleteAdminPartner(deleteTarget.id, {
        confirm_warning: true,
        confirmation_text: '업체삭제',
        reason: deleteReason.trim(),
      })
      showToast('업체가 삭제되었습니다.', 'success')
      setDeleteTarget(null)
      setDrawer(null)
      void load()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '업체 삭제에 실패했습니다.'), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUndelete = async () => {
    if (!undeleteTarget || !undeleteConfirmChecked || !undeleteReason.trim()) return
    setActionLoading(true)
    try {
      await undeleteAdminPartner(undeleteTarget.id, {
        confirm_warning: true,
        reason: undeleteReason.trim(),
      })
      showToast('삭제 업체가 복구되었습니다. 공개·구독 상태를 확인해 주세요.', 'success')
      setUndeleteTarget(null)
      setUndeleteReason('')
      setUndeleteConfirmChecked(false)
      setDrawer(null)
      void load()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '업체 복구에 실패했습니다.'), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const applySavedFilter = (item: AdminSavedPartnerFilter) => {
    const f = item.filters
    setKpi((String(f.kpi || 'all') as KpiKey) || 'all')
    setBizType((String(f.bizType || 'all') as AdminBizTypeFilterKey) || 'all')
    setPlanTier(String(f.planTier || 'all'))
    if (f.hasCoordinates === true) setCoords('yes')
    else if (f.hasCoordinates === false) setCoords('no')
    else setCoords('all')
    setSort(String(f.sort || 'created_at:desc'))
    setSearch(String(f.keyword || ''))
    setSearchInput(String(f.keyword || ''))
    setPageSize(Number(f.pageSize || 30) || 30)
    const tags = Array.isArray(f.tagIds) ? f.tagIds.map((x) => String(x)) : []
    setSelectedTagIds(tags)
    setPage(1)
    clearSelection()
    showToast(`필터 "${item.name}" 적용`, 'success')
  }

  const handleSaveFilter = async () => {
    if (!saveFilterName.trim()) return
    setSavedFilterBusy(true)
    try {
      await createAdminPartnerSavedFilter({
        name: saveFilterName.trim(),
        filters: currentFilters,
      })
      setSaveFilterName('')
      setSaveFilterOpen(false)
      await loadSavedFilters()
      showToast('필터를 저장했습니다.', 'success')
    } catch (e) {
      showToast(formatAdminPermissionError(e, '필터 저장에 실패했습니다.'), 'error')
    } finally {
      setSavedFilterBusy(false)
    }
  }

  const toggleRowSelect = (id: string) => {
    setFilterSelectAll(false)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePageSelect = () => {
    const pageIds = businesses.map((b) => b.id)
    const allSelected = pageIds.every((id) => selectedIds.has(id))
    setFilterSelectAll(false)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })
  }

  const openBulkTags = (action: 'ADD' | 'REMOVE') => {
    if (selectionCount <= 0) return
    setBulkTagAction(action)
    setBulkTagIds([])
    setBulkReason('')
    setBulkPreview(null)
    setBulkResultText('')
    setBulkMode('tags')
  }

  const openBulkAssignment = async () => {
    if (selectionCount <= 0) return
    setBulkAssignAction('ASSIGN')
    setBulkAgentId('')
    setBulkReason('')
    setBulkPreview(null)
    setBulkResultText('')
    setBulkMode('assignment')
    try {
      const res = await fetchAdminSalesAgents({ status: 'ACTIVE', pageSize: 100 })
      setAgents(res.items ?? [])
    } catch {
      setAgents([])
    }
  }

  const runBulkPreview = async () => {
    setBulkBusy(true)
    setBulkPreview(null)
    try {
      if (bulkMode === 'tags') {
        const preview = await previewAdminPartnersBulk({
          selection: selectionPayload(),
          action: bulkTagAction === 'ADD' ? 'TAGS_ADD' : 'TAGS_REMOVE',
          tag_ids: bulkTagIds.map(Number),
        })
        setBulkPreview(preview)
      } else if (bulkMode === 'assignment') {
        const preview = await previewAdminPartnersBulk({
          selection: selectionPayload(),
          action: bulkAssignAction,
          agent_id: bulkAssignAction === 'ASSIGN' ? Number(bulkAgentId) || null : null,
        })
        setBulkPreview(preview)
      }
    } catch (e) {
      showToast(formatAdminPermissionError(e, '미리보기에 실패했습니다.'), 'error')
    } finally {
      setBulkBusy(false)
    }
  }

  const runBulkExecute = async () => {
    if (!bulkPreview) {
      showToast('먼저 미리보기를 실행하세요.', 'error')
      return
    }
    setBulkBusy(true)
    setBulkResultText('')
    try {
      if (bulkMode === 'tags') {
        if (!bulkTagIds.length) {
          showToast('태그를 선택하세요.', 'error')
          return
        }
        const result = await bulkAdminPartnerTags({
          selection: selectionPayload(),
          action: bulkTagAction,
          tag_ids: bulkTagIds.map(Number),
          reason: bulkReason.trim() || undefined,
        })
        setBulkResultText(
          `요청 ${result.matched} · 변경 ${result.updated} · 건너뜀 ${result.skipped} · 실패 ${result.failed}`,
        )
        showToast('일괄 태그 작업을 완료했습니다.', 'success')
      } else if (bulkMode === 'assignment') {
        if (bulkAssignAction === 'ASSIGN' && !bulkAgentId) {
          showToast('영업사원을 선택하세요.', 'error')
          return
        }
        const result = await bulkAdminPartnerAssignment({
          selection: selectionPayload(),
          action: bulkAssignAction,
          agent_id: bulkAssignAction === 'ASSIGN' ? Number(bulkAgentId) : null,
          reason: bulkReason.trim() || undefined,
        })
        setBulkResultText(
          `요청 ${result.matched} · 변경 ${result.updated} · 건너뜀 ${result.skipped} · 실패 ${result.failed}`,
        )
        showToast('일괄 담당자 작업을 완료했습니다.', 'success')
      }
      clearSelection()
      void load()
    } catch (e) {
      showToast(formatAdminPermissionError(e, '일괄 작업에 실패했습니다.'), 'error')
    } finally {
      setBulkBusy(false)
    }
  }

  const handleCsv = async (mode: 'selected' | 'filter') => {
    setCsvBusy(true)
    try {
      if (mode === 'selected') {
        if (filterSelectAll) {
          await exportAdminPartnersCsv({ filters: currentFilters })
        } else {
          const ids = Array.from(selectedIds).map(Number)
          if (!ids.length) {
            showToast('선택된 업체가 없습니다.', 'error')
            return
          }
          await exportAdminPartnersCsv({ partnerIds: ids })
        }
      } else {
        await exportAdminPartnersCsv({ filters: currentFilters })
      }
      showToast('CSV 다운로드를 시작했습니다.', 'success')
    } catch (e) {
      showToast(formatAdminPermissionError(e, 'CSV 다운로드에 실패했습니다.'), 'error')
    } finally {
      setCsvBusy(false)
    }
  }

  const pageAllSelected =
    businesses.length > 0 && businesses.every((b) => selectedIds.has(b.id)) && !filterSelectAll

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="업체 운영센터"
        description="가입·승인·운영·영업조직·구독 상태를 한곳에서 관리합니다."
        actions={
          <button
            type="button"
            onClick={() => router.push('/admin/businesses/pending')}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            승인대기 심사
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {KPI_CARDS.map((card) => {
          const active = kpi === card.key
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                setKpi(card.key)
                setPage(1)
              }}
              className={`text-left rounded-xl transition ring-offset-2 ${
                active ? 'ring-2 ring-blue-500' : 'hover:opacity-90'
              }`}
            >
              <AdminStatCard
                label={card.label}
                value={summary?.[card.summaryKey] ?? '-'}
                color={card.color}
              />
            </button>
          )
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearch(searchInput.trim())
                setPage(1)
              }
            }}
            placeholder="업체명 · 대표자 · 이메일 · 전화 · 사업자번호 · slug"
            className="flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
          <select
            value={bizType}
            onChange={(e) => {
              setBizType(e.target.value as AdminBizTypeFilterKey)
              setPage(1)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            {ADMIN_BIZ_TYPE_FILTERS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={planTier}
            onChange={(e) => {
              setPlanTier(e.target.value)
              setPage(1)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <option value="all">전체 플랜</option>
            <option value="BASIC">BASIC</option>
            <option value="STANDARD">STANDARD</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
          <select
            value={coords}
            onChange={(e) => {
              setCoords(e.target.value)
              setPage(1)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <option value="all">좌표 전체</option>
            <option value="yes">좌표 등록</option>
            <option value="no">좌표 미등록</option>
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              setPage(1)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}건
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearch(searchInput.trim())
              setPage(1)
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
          >
            검색
          </button>
          <button
            type="button"
            onClick={() => {
              setKpi('all')
              setBizType('all')
              setPlanTier('all')
              setCoords('all')
              setSort('created_at:desc')
              setSearch('')
              setSearchInput('')
              setSelectedTagIds([])
              setPage(1)
              setPageSize(30)
            }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
          >
            초기화
          </button>
        </div>
        {tagCatalog.length ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-xs text-gray-500 self-center mr-1">
              운영 태그 (다중 선택 · OR)
            </span>
            {tagCatalog.map((tag) => {
              const active = selectedTagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTagFilter(tag.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    active ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-200'
                  }`}
                  style={
                    active
                      ? { backgroundColor: tag.color, borderColor: tag.color }
                      : { color: tag.color, borderColor: `${tag.color}55` }
                  }
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">저장 필터</span>
          {savedFilters.map((sf) => (
            <div key={sf.id} className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => applySavedFilter(sf)}
                className={`text-xs px-2.5 py-1 rounded-lg border ${
                  sf.is_default
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {sf.name}
                {sf.is_default ? ' ★' : ''}
              </button>
              <button
                type="button"
                title="기본 필터"
                onClick={() => {
                  void setDefaultAdminPartnerSavedFilter(sf.id)
                    .then(() => loadSavedFilters())
                    .catch((e) =>
                      showToast(formatAdminPermissionError(e, '기본 필터 설정 실패'), 'error'),
                    )
                }}
                className="text-[10px] text-gray-400 hover:text-blue-600"
              >
                기본
              </button>
              <button
                type="button"
                title="삭제"
                onClick={() => {
                  if (!window.confirm(`"${sf.name}" 필터를 삭제할까요?`)) return
                  void deleteAdminPartnerSavedFilter(sf.id)
                    .then(() => loadSavedFilters())
                    .catch((e) =>
                      showToast(formatAdminPermissionError(e, '필터 삭제 실패'), 'error'),
                    )
                }}
                className="text-[10px] text-gray-400 hover:text-red-600"
              >
                삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSaveFilterOpen(true)}
            className="text-xs px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            현재 조건 저장
          </button>
          <PermissionGate menuKey="businesses" action="download">
            <button
              type="button"
              disabled={csvBusy}
              onClick={() => void handleCsv('filter')}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              검색결과 CSV
            </button>
          </PermissionGate>
        </div>

        <p className="text-xs text-gray-500">
          총 {total.toLocaleString()}건 · 서버 페이지네이션 · URL 필터 동기화
          {filterSelectAll
            ? ` · 검색 결과 전체 ${total.toLocaleString()}개 선택`
            : selectedIds.size
              ? ` · 선택 ${selectedIds.size.toLocaleString()}개`
              : ''}
        </p>
      </div>

      {selectionCount > 0 ? (
        <div className="sticky top-0 z-10 bg-slate-900 text-white rounded-xl px-4 py-3 flex flex-wrap items-center gap-2 shadow-lg">
          <span className="text-sm font-medium">
            {filterSelectAll
              ? `검색 결과 전체 ${total.toLocaleString()}개 선택`
              : `선택 ${selectedIds.size.toLocaleString()}개`}
          </span>
          <button
            type="button"
            onClick={() => {
              setFilterSelectAll(true)
              setSelectedIds(new Set())
            }}
            className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20"
          >
            검색 결과 전체 선택
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20"
          >
            선택 해제
          </button>
          {canEditOps ? (
            <>
              <button
                type="button"
                onClick={() => openBulkTags('ADD')}
                className="text-xs px-2.5 py-1 rounded bg-blue-500 hover:bg-blue-400"
              >
                태그 추가
              </button>
              <button
                type="button"
                onClick={() => openBulkTags('REMOVE')}
                className="text-xs px-2.5 py-1 rounded bg-blue-500 hover:bg-blue-400"
              >
                태그 제거
              </button>
            </>
          ) : null}
          {canEditAssignment ? (
            <button
              type="button"
              onClick={() => void openBulkAssignment()}
              className="text-xs px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400"
            >
              담당자 변경
            </button>
          ) : null}
          {canDownload ? (
            <button
              type="button"
              disabled={csvBusy}
              onClick={() => void handleCsv('selected')}
              className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40"
            >
              선택 CSV
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">업체 목록을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void load()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <AdminTable
            loading={loading}
            columns={
              isDeletedVault
                ? [
                    { key: 'select', label: '선택', width: '48px' },
                    { key: 'name', label: '업체명' },
                    { key: 'bizType', label: '업종', width: '90px' },
                    { key: 'region', label: '지역', width: '70px' },
                    { key: 'status', label: '보존 상태', width: '90px' },
                    { key: 'deletedAt', label: '삭제일', width: '110px' },
                    { key: 'actions', label: '작업', width: '150px' },
                  ]
                : [
                    { key: 'select', label: '선택', width: '48px' },
                    { key: 'name', label: '업체명' },
                    { key: 'bizType', label: '업종', width: '90px' },
                    { key: 'region', label: '지역', width: '70px' },
                    { key: 'status', label: '상태', width: '90px' },
                    { key: 'tags', label: '태그', width: '140px' },
                    { key: 'latestMemo', label: '최근 메모', width: '160px' },
                    { key: 'plan', label: '플랜', width: '90px' },
                    { key: 'distributor', label: '총판', width: '100px' },
                    { key: 'agency', label: '영업점', width: '100px' },
                    { key: 'agent', label: '영업사원', width: '100px' },
                    { key: 'lastLogin', label: '최근 로그인', width: '100px' },
                    { key: 'recentReservations', label: '최근 예약', width: '80px' },
                    { key: 'createdAt', label: '가입일', width: '100px' },
                    { key: 'coords', label: '좌표', width: '80px' },
                    { key: 'actions', label: '작업', width: '150px' },
                  ]
            }
            data={businesses.map((b) => ({
              ...b,
              select: (
                <input
                  type="checkbox"
                  checked={filterSelectAll || selectedIds.has(b.id)}
                  onChange={() => toggleRowSelect(b.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`${b.name} 선택`}
                />
              ),
              bizType: getAdminBizTypeLabel(b.bizType),
              region: b.regionCode || '-',
              plan: b.planTier || b.plan || '-',
              distributor: b.distributorName || '-',
              agency: b.agencyName || '-',
              agent: b.agentName || '-',
              lastLogin: b.lastLogin || '미접속',
              recentReservations:
                b.recentReservations > 0 ? b.recentReservations : '예약 없음',
              coords: b.hasCoordinates ? '등록됨' : '미등록',
              deletedAt: b.deletedAt ? b.deletedAt.slice(0, 10) : '-',
              tags: b.tags?.length ? (
                <div className="flex flex-wrap gap-1">
                  {b.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block text-[10px] px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {b.tags.length > 3 ? (
                    <span className="text-[10px] text-gray-400">+{b.tags.length - 3}</span>
                  ) : null}
                </div>
              ) : (
                <span className="text-xs text-gray-300">-</span>
              ),
              latestMemo: b.latestMemo?.content ? (
                <span className="text-xs text-gray-600 line-clamp-2" title={b.latestMemo.content}>
                  {b.latestMemo.is_pinned ? '[핀] ' : ''}
                  {b.latestMemo.content}
                </span>
              ) : (
                <span className="text-xs text-gray-300">-</span>
              ),
              status: (
                <AdminBadge
                  label={BUSINESS_STATUS_LABEL[b.status] ?? b.status}
                  variant={BUSINESS_STATUS_VARIANT[b.status] ?? 'neutral'}
                />
              ),
              actions: (
                <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                  <ActionBtn label="상세" onClick={() => void openDrawer(b.id)} />
                  {isDeletedVault ? (
                    <PermissionGate menuKey="businesses" action="delete">
                      <ActionBtn
                        label="삭제복구"
                        onClick={() => {
                          setUndeleteTarget(b)
                          setUndeleteReason('')
                          setUndeleteConfirmChecked(false)
                        }}
                      />
                    </PermissionGate>
                  ) : (
                    <>
                      {b.status === 'active' && (
                        <PermissionGate menuKey="businesses" action="edit">
                          <ActionBtn
                            label="정지"
                            danger
                            onClick={() =>
                              setConfirm({
                                business: b,
                                title: '업체 정지',
                                message: `${b.name} 업체를 정지하시겠습니까?`,
                                nextStatus: 'suspended',
                                variant: 'danger',
                              })
                            }
                          />
                        </PermissionGate>
                      )}
                      {b.status === 'suspended' && (
                        <PermissionGate menuKey="businesses" action="edit">
                          <ActionBtn
                            label="정지해제"
                            onClick={() =>
                              setConfirm({
                                business: b,
                                title: '정지 해제',
                                message: `${b.name} 업체 정지를 해제하시겠습니까?`,
                                nextStatus: 'active',
                                variant: 'primary',
                              })
                            }
                          />
                        </PermissionGate>
                      )}
                    </>
                  )}
                </div>
              ),
            }))}
            onRowClick={(row) => void openDrawer(String(row.id))}
            emptyMessage="조건에 맞는 업체가 없습니다."
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={pageAllSelected} onChange={togglePageSelect} />
                현재 페이지 전체 선택
              </label>
              <span>
                {page}/{totalPages}페이지
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                이전
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminModal
        open={!!drawer || drawerLoading}
        onClose={() => setDrawer(null)}
        title={drawer?.business_name || (drawerLoading ? '불러오는 중...' : '업체 상세')}
        size="lg"
        footer={
          drawer ? (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => router.push(`/admin/businesses/${drawer.id}`)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              >
                전체 상세
              </button>
              {drawer.deleted_at ? (
                <PermissionGate menuKey="businesses" action="delete">
                  <button
                    type="button"
                    onClick={() => {
                      const row =
                        selectedBusiness ||
                        ({
                          id: drawer.id,
                          name: drawer.business_name,
                          status: drawer.status.toLowerCase(),
                        } as AdminPartnerListItem)
                      setUndeleteTarget(row)
                      setUndeleteReason('')
                      setUndeleteConfirmChecked(false)
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm text-white bg-blue-600"
                  >
                    삭제 복구
                  </button>
                </PermissionGate>
              ) : (
                <>
                  {selectedBusiness?.status === 'active' && (
                    <PermissionGate menuKey="businesses" action="edit">
                      <button
                        type="button"
                        onClick={() =>
                          setConfirm({
                            business: selectedBusiness,
                            title: '업체 정지',
                            message: `${selectedBusiness.name} 업체를 정지하시겠습니까?`,
                            nextStatus: 'suspended',
                            variant: 'danger',
                          })
                        }
                        className="px-3 py-1.5 rounded-lg text-sm text-white bg-red-600"
                      >
                        정지
                      </button>
                    </PermissionGate>
                  )}
                  <PermissionGate menuKey="businesses" action="delete">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedBusiness) void openDeleteModal(selectedBusiness)
                        else {
                          void openDeleteModal({
                            id: drawer.id,
                            name: drawer.business_name,
                            bizType: drawer.biz_type,
                            ownerName: drawer.owner_name ?? '',
                            phone: drawer.phone ?? '',
                            status: drawer.status.toLowerCase(),
                            plan: drawer.plan_tier ?? null,
                            slug: drawer.slug,
                            createdAt: drawer.created_at.slice(0, 10),
                            lastLogin: null,
                            recentReservations: drawer.recent_reservations ?? 0,
                            recentRevenue: 0,
                            rating: null,
                            email: drawer.email ?? '',
                            businessRegistrationNo: drawer.business_registration_no ?? '',
                            address: drawer.address ?? '',
                            hasCoordinates: Boolean(
                              drawer.latitude != null && drawer.longitude != null,
                            ),
                            bayCount: drawer.bay_count,
                            regionCode: drawer.region_code ?? null,
                            planTier: drawer.plan_tier ?? null,
                            distributorName: drawer.distributor_name ?? null,
                            agencyName: drawer.agency_name ?? null,
                            agentName: drawer.agent_name ?? null,
                            franchiseName: drawer.franchise_name ?? null,
                            deletedAt: drawer.deleted_at ?? null,
                            tags: drawer.tags ?? [],
                            latestMemo: drawer.latest_memo ?? null,
                          })
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-sm border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      업체 삭제
                    </button>
                  </PermissionGate>
                </>
              )}
            </div>
          ) : null
        }
      >
        {drawer ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Info label="대표자" value={drawer.owner_name} />
              <Info label="연락처" value={drawer.phone} />
              <Info label="이메일" value={drawer.email} />
              <Info label="사업자번호" value={drawer.business_registration_no} />
              <Info label="주소" value={drawer.address} />
              <Info
                label="좌표"
                value={
                  drawer.latitude != null && drawer.longitude != null
                    ? `${drawer.latitude}, ${drawer.longitude}`
                    : '미등록'
                }
              />
              <Info label="플랜" value={drawer.plan_tier} />
              <Info label="구독상태" value={drawer.subscription_status} />
              <Info label="총판" value={drawer.distributor_name} />
              <Info label="영업점" value={drawer.agency_name} />
              <Info label="영업사원" value={drawer.agent_name} />
              <Info label="프랜차이즈" value={drawer.franchise_name} />
              <Info
                label="최근 로그인"
                value={
                  drawer.last_login_at ? drawer.last_login_at.slice(0, 10) : '미접속'
                }
              />
              <Info
                label="최근 예약(30일)"
                value={
                  (drawer.recent_reservations ?? 0) > 0
                    ? String(drawer.recent_reservations)
                    : '예약 없음'
                }
              />
              {drawer.deleted_at ? (
                <Info label="삭제일" value={drawer.deleted_at.slice(0, 19).replace('T', ' ')} />
              ) : null}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">운영 태그</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(drawer.tags ?? []).length ? (
                  (drawer.tags ?? []).map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                      {canEditOps ? (
                        <button
                          type="button"
                          disabled={tagSaving}
                          onClick={() => void handleDetachTag(tag.id)}
                          className="opacity-80 hover:opacity-100"
                          aria-label={`${tag.name} 제거`}
                        >
                          ×
                        </button>
                      ) : null}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">연결된 태그가 없습니다.</span>
                )}
              </div>
              <PermissionGate menuKey="businesses" action="edit">
                <select
                  disabled={tagSaving}
                  defaultValue=""
                  onChange={(e) => {
                    const tagId = e.target.value
                    e.target.value = ''
                    if (tagId) void handleAttachTag(tagId)
                  }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                >
                  <option value="">태그 추가…</option>
                  {tagCatalog
                    .filter((tag) => !(drawer.tags ?? []).some((t) => t.id === tag.id))
                    .map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                </select>
              </PermissionGate>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">운영 메모</p>
              <PermissionGate menuKey="businesses" action="edit">
                <div className="space-y-2 mb-3">
                  <textarea
                    value={memoDraft}
                    onChange={(e) => setMemoDraft(e.target.value)}
                    rows={3}
                    placeholder={editingMemoId ? '메모 수정…' : '내부 운영 메모 작성…'}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={memoPinned}
                        onChange={(e) => setMemoPinned(e.target.checked)}
                      />
                      핀 고정
                    </label>
                    <div className="flex gap-2">
                      {editingMemoId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMemoId(null)
                            setMemoDraft('')
                            setMemoPinned(false)
                          }}
                          className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg"
                        >
                          취소
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={memoSaving || !memoDraft.trim()}
                        onClick={() => void handleSaveMemo()}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                      >
                        {memoSaving ? '저장 중…' : editingMemoId ? '메모 수정' : '메모 작성'}
                      </button>
                    </div>
                  </div>
                </div>
              </PermissionGate>
              {(drawer.recent_memos ?? drawer.memos ?? []).length ? (
                <ul className="space-y-2">
                  {(drawer.recent_memos ?? drawer.memos ?? []).slice(0, 5).map((memo) => (
                    <li
                      key={memo.id}
                      className={`border rounded-lg px-3 py-2 ${
                        memo.is_pinned ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex justify-between gap-2 mb-1">
                        <span className="text-xs text-gray-500">
                          {memo.is_pinned ? '[핀] ' : ''}
                          {memo.author_name || `관리자#${memo.author_admin_id}`}
                        </span>
                        <span className="text-xs text-gray-400">{formatMemoTime(memo.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{memo.content}</p>
                      {memo.updated_at ? (
                        <p className="text-[11px] text-gray-400 mt-1">
                          수정 {formatMemoTime(memo.updated_at)}
                        </p>
                      ) : null}
                      <PermissionGate menuKey="businesses" action="edit">
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            disabled={memoSaving}
                            onClick={() => handleEditMemo(memo)}
                            className="text-[11px] text-blue-600"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            disabled={memoSaving}
                            onClick={() => void handleTogglePin(memo)}
                            className="text-[11px] text-amber-700"
                          >
                            {memo.is_pinned ? '핀 해제' : '핀 고정'}
                          </button>
                          <button
                            type="button"
                            disabled={memoSaving}
                            onClick={() => void handleDeleteMemo(memo.id)}
                            className="text-[11px] text-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </PermissionGate>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">등록된 운영 메모가 없습니다.</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">최근 변경 (감사로그)</p>
              {drawer.recent_audits?.length ? (
                <ul className="space-y-2">
                  {drawer.recent_audits.map((audit) => (
                    <li key={audit.id} className="border border-gray-100 rounded-lg px-3 py-2">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">{audit.action}</span>
                        <span className="text-xs text-gray-400">
                          {audit.created_at.slice(0, 19).replace('T', ' ')}
                        </span>
                      </div>
                      {audit.reason ? <p className="text-xs text-gray-500 mt-1">{audit.reason}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">최근 변경 이력이 없습니다.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">불러오는 중...</p>
        )}
      </AdminModal>

      <AdminModal
        open={!!confirm}
        onClose={() => {
          setConfirm(null)
          setRejectReason('')
        }}
        title={confirm?.title ?? ''}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirm(null)}
              disabled={actionLoading}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleStatusAction()}
              disabled={actionLoading || (confirm?.needsReason && !rejectReason.trim())}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                confirm?.variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {actionLoading ? '처리 중...' : '확인'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">{confirm?.message}</p>
        {confirm?.needsReason && (
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="거절 사유를 입력하세요"
            rows={3}
            className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </AdminModal>

      <AdminModal
        open={!!deleteTarget}
        onClose={() => {
          if (actionLoading) return
          setDeleteTarget(null)
          setDeleteImpact(null)
        }}
        title="업체 삭제"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setDeleteTarget(null)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              disabled={
                actionLoading ||
                deleteImpactLoading ||
                !deleteImpact?.can_delete ||
                !deleteConfirmChecked ||
                deleteConfirmText.trim() !== '업체삭제' ||
                !deleteReason.trim()
              }
              onClick={() => void handleSoftDelete()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? '삭제 중...' : '최종 삭제'}
            </button>
          </div>
        }
      >
        {deleteTarget ? (
          <div className="space-y-4 text-sm text-gray-700">
            <p className="font-medium text-gray-900">업체를 삭제하시겠습니까?</p>
            <p>
              삭제하면 업체와 삭제 대상 직원 계정이 로그인할 수 없으며,
              고객앱·검색·지도·신규 예약에서 업체가 제외됩니다.
            </p>
            <p>기존 예약·결제·정산·리뷰 이력은 보존됩니다.</p>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs">
              <span>업체명: {deleteTarget.name}</span>
              <span>상태: {deleteTarget.status}</span>
              {deleteImpactLoading || !deleteImpact ? (
                <span className="col-span-2 text-gray-400">영향도 불러오는 중...</span>
              ) : (
                <>
                  <span>대표 계정: {deleteImpact.account_effects.owner_accounts_disabled}</span>
                  <span>직원 계정: {deleteImpact.counts.staff_accounts}</span>
                  <span>진행 중 예약: {deleteImpact.counts.active_reservations}</span>
                  <span>미래 예약: {deleteImpact.counts.future_reservations}</span>
                  <span>처리 중 결제: {deleteImpact.counts.pending_payments}</span>
                  <span>미정산: {deleteImpact.counts.unsettled_payments}</span>
                  <span>처리 중 환불: {deleteImpact.counts.pending_refunds}</span>
                  <span>과거 예약: {deleteImpact.counts.completed_reservations}</span>
                  <span>리뷰: {deleteImpact.counts.reviews}</span>
                </>
              )}
            </div>
            {deleteImpact && !deleteImpact.can_delete ? (
              <div className="border border-red-200 bg-red-50 rounded-lg p-3 space-y-1">
                <p className="text-red-700 font-medium">예약 또는 정산을 먼저 처리해 주세요.</p>
                {deleteImpact.blocking_reasons.map((r) => (
                  <p key={r.code} className="text-red-600 text-xs">
                    · {r.message}
                  </p>
                ))}
              </div>
            ) : null}
            {deleteImpact?.can_delete ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">삭제 사유</label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="삭제 사유를 입력하세요"
                  />
                </div>
                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={deleteConfirmChecked}
                    onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>위 내용을 확인했으며 soft-delete에 동의합니다.</span>
                </label>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    확인을 위해 <strong>업체삭제</strong>를 입력하세요
                  </label>
                  <input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="업체삭제"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={!!undeleteTarget}
        onClose={() => {
          if (actionLoading) return
          setUndeleteTarget(null)
        }}
        title="삭제 업체 복구"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setUndeleteTarget(null)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              disabled={
                actionLoading || !undeleteConfirmChecked || !undeleteReason.trim()
              }
              onClick={() => void handleUndelete()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? '복구 중...' : '최종 복구'}
            </button>
          </div>
        }
      >
        {undeleteTarget ? (
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>{undeleteTarget.name}</strong> 업체를 복구하시겠습니까?
            </p>
            <p className="text-xs text-gray-500">
              복구 후 자동으로 고객앱에 공개되거나 구독 자동갱신이 재개되지 않습니다.
              상태·구독을 별도로 확인해 주세요.
            </p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">복구 사유</label>
              <textarea
                value={undeleteReason}
                onChange={(e) => setUndeleteReason(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="복구 사유"
              />
            </div>
            <label className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={undeleteConfirmChecked}
                onChange={(e) => setUndeleteConfirmChecked(e.target.checked)}
                className="mt-0.5"
              />
              <span>복구 안내를 확인했습니다.</span>
            </label>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={saveFilterOpen}
        onClose={() => {
          if (savedFilterBusy) return
          setSaveFilterOpen(false)
        }}
        title="현재 검색 조건 저장"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={savedFilterBusy}
              onClick={() => setSaveFilterOpen(false)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              취소
            </button>
            <button
              type="button"
              disabled={savedFilterBusy || !saveFilterName.trim()}
              onClick={() => void handleSaveFilter()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 disabled:opacity-50"
            >
              {savedFilterBusy ? '저장 중...' : '저장'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-xs text-gray-500">
            page는 저장되지 않습니다. 저장 후 적용 시 1페이지부터 조회됩니다.
          </p>
          <input
            value={saveFilterName}
            onChange={(e) => setSaveFilterName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="예: 강원도 Premium 업체"
            maxLength={80}
          />
        </div>
      </AdminModal>

      <AdminModal
        open={bulkMode !== null}
        onClose={() => {
          if (bulkBusy) return
          setBulkMode(null)
        }}
        title={
          bulkMode === 'tags'
            ? bulkTagAction === 'ADD'
              ? '일괄 태그 추가'
              : '일괄 태그 제거'
            : bulkAssignAction === 'UNASSIGN'
              ? '일괄 담당 해제'
              : '일괄 담당자 변경'
        }
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => setBulkMode(null)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              닫기
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulkPreview()}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              미리보기
            </button>
            <button
              type="button"
              disabled={bulkBusy || !bulkPreview}
              onClick={() => void runBulkExecute()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 disabled:opacity-50"
            >
              {bulkBusy ? '처리 중...' : '실행'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            대상:{' '}
            {filterSelectAll
              ? `검색 결과 전체 (약 ${total.toLocaleString()}건, 서버 재계산)`
              : `${selectedIds.size.toLocaleString()}개 ID`}
          </p>
          {bulkMode === 'tags' ? (
            <div className="flex flex-wrap gap-1.5">
              {tagCatalog.map((tag) => {
                const active = bulkTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setBulkTagIds((prev) =>
                        prev.includes(tag.id)
                          ? prev.filter((id) => id !== tag.id)
                          : [...prev, tag.id],
                      )
                    }
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      active ? 'text-white border-transparent' : 'border-gray-200'
                    }`}
                    style={
                      active
                        ? { backgroundColor: tag.color }
                        : { color: tag.color, borderColor: `${tag.color}55` }
                    }
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={bulkAssignAction}
                onChange={(e) =>
                  setBulkAssignAction(e.target.value as 'ASSIGN' | 'UNASSIGN')
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="ASSIGN">영업사원 배정/변경</option>
                <option value="UNASSIGN">배정 해제</option>
              </select>
              {bulkAssignAction === 'ASSIGN' ? (
                <select
                  value={bulkAgentId}
                  onChange={(e) => setBulkAgentId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">영업사원 선택</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                      {a.agencyName ? ` · ${a.agencyName}` : ''}
                      {a.distributorName ? ` · ${a.distributorName}` : ''}
                    </option>
                  ))}
                </select>
              ) : null}
              <p className="text-xs text-gray-500">
                과거 배정·수수료 이력은 유지되고, 활성 배정만 변경됩니다. 삭제 업체는
                건너뜁니다.
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">사유 (선택)</label>
            <input
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              maxLength={255}
            />
          </div>
          {bulkPreview ? (
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs space-y-1">
              <p>매칭 {bulkPreview.matched} · 활성 {bulkPreview.active_count} · 삭제 {bulkPreview.deleted_count}</p>
              {bulkPreview.assignable_count > 0 ? (
                <p>배정 가능 {bulkPreview.assignable_count} · 삭제 건너뜀 {bulkPreview.skipped_deleted}</p>
              ) : null}
              {bulkPreview.agent_name ? <p>변경 담당: {bulkPreview.agent_name}</p> : null}
              {bulkPreview.notes.map((n) => (
                <p key={n} className="text-gray-500">
                  {n}
                </p>
              ))}
            </div>
          ) : null}
          {bulkResultText ? (
            <p className="text-sm text-blue-700 font-medium">{bulkResultText}</p>
          ) : null}
        </div>
      </AdminModal>
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5 break-all">{value || '-'}</p>
    </div>
  )
}

function ActionBtn({
  label,
  onClick,
  danger,
}: {
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-medium border ${
        danger
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}
