'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import { useToast } from '@/components/admin/AdminToast'
import {
  BANNER_LINK_TYPES,
  BANNER_PLACEMENTS,
  BANNER_STATUSES,
  EMPTY_BANNER_FORM,
  canActivateBanner,
  fromDatetimeLocalValue,
  statusActionsFor,
  toDatetimeLocalValue,
  validateBannerImageFile,
  validateExternalUrl,
  type BannerFormState,
} from '@/components/admin/banners/bannerFormUtils'
import {
  createBanner,
  deleteBanner,
  getAdminBanner,
  getAdminBanners,
  getBannerMetrics,
  reorderBanners,
  updateBanner,
  updateBannerStatus,
  uploadBannerImage,
  type AdminBanner,
  type BannerMetrics,
  type BannerPlacement,
  type BannerStatus,
} from '@/lib/admin-api'
import {
  ADMIN_BANNER_LINK_TYPE_LABEL,
  ADMIN_BANNER_PLACEMENT_LABEL,
  ADMIN_BANNER_STATUS_LABEL,
  formatAdminBannerPeriod,
} from '@/lib/admin-ui'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  DRAFT: 'neutral',
  SCHEDULED: 'info',
  ACTIVE: 'success',
  PAUSED: 'warning',
  ENDED: 'error',
}

const REORDER_PAGE_SIZE = 100

function errMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message
  return fallback
}

function placementLabel(v: string): string {
  return ADMIN_BANNER_PLACEMENT_LABEL[v] ?? v
}

function statusLabel(v: string): string {
  return ADMIN_BANNER_STATUS_LABEL[v] ?? v
}

function linkTypeLabel(v: string): string {
  return ADMIN_BANNER_LINK_TYPE_LABEL[v] ?? v
}

function buildCreatePayload(form: BannerFormState) {
  const linkType = form.linkType
  let linkValue: string | null = form.linkValue.trim() || null
  if (linkType === 'NONE') linkValue = null
  const partnerRaw = form.partnerId.trim()
  const partnerId = partnerRaw ? Number(partnerRaw) : null
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || null,
    placement: form.placement,
    linkType,
    linkValue,
    partnerId: partnerId != null && !Number.isNaN(partnerId) ? partnerId : null,
    startAt: fromDatetimeLocalValue(form.startAt),
    endAt: fromDatetimeLocalValue(form.endAt),
    displayOrder: Number(form.displayOrder) || 0,
    status: 'DRAFT',
  }
}

function validateForm(form: BannerFormState): string | null {
  if (!form.title.trim()) return '제목을 입력하세요.'
  if (form.linkType === 'STORE' && !form.linkValue.trim()) {
    return '앱 이동용 매장 slug를 입력하세요.'
  }
  if (form.linkType === 'EXTERNAL_URL') {
    const u = validateExternalUrl(form.linkValue)
    if (u) return u
  }
  if (form.partnerId.trim() && Number.isNaN(Number(form.partnerId.trim()))) {
    return '연결 매장 ID는 숫자여야 합니다.'
  }
  const start = fromDatetimeLocalValue(form.startAt)
  const end = fromDatetimeLocalValue(form.endAt)
  if (start && end && new Date(start).getTime() >= new Date(end).getTime()) {
    return '시작 시각은 종료 시각보다 앞서야 합니다.'
  }
  return null
}

function BannerThumb({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[10px] text-gray-400">
        이미지 없음
      </div>
    )
  }
  return (
    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="h-full w-full object-cover" />
    </div>
  )
}

function EllipsisText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`block max-w-[220px] truncate ${className ?? ''}`} title={text}>
      {text}
    </span>
  )
}

export default function AdminBannersPage() {
  const { showToast, ToastComponent } = useToast()
  const [items, setItems] = useState<AdminBanner[]>([])
  const [metrics, setMetrics] = useState<BannerMetrics | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [placement, setPlacement] = useState('all')
  const [status, setStatus] = useState('all')
  const [partnerIdInput, setPartnerIdInput] = useState('')
  const [partnerId, setPartnerId] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [errorDetail, setErrorDetail] = useState('')
  const [metricsError, setMetricsError] = useState(false)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<BannerFormState>(EMPTY_BANNER_FORM)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editorLoading, setEditorLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmBody, setConfirmBody] = useState('')
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  const [reorderSaving, setReorderSaving] = useState(false)
  const listAbort = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reorderMode = placement !== 'all'

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true)
    setMetricsError(false)
    try {
      const data = await getBannerMetrics()
      setMetrics(data)
    } catch {
      setMetricsError(true)
      setMetrics(null)
    } finally {
      setMetricsLoading(false)
    }
  }, [])

  const loadList = useCallback(async () => {
    const seq = ++listAbort.current
    setLoading(true)
    setError(false)
    setErrorDetail('')
    try {
      const data = await getAdminBanners({
        keyword,
        placement,
        status,
        partnerId,
        page,
        pageSize: reorderMode ? REORDER_PAGE_SIZE : pageSize,
      })
      if (seq !== listAbort.current) return
      setItems(data.items)
      setTotal(data.total)
    } catch (e) {
      if (seq !== listAbort.current) return
      setError(true)
      setErrorDetail(errMessage(e, '배너 목록을 불러오지 못했습니다.'))
      setItems([])
      setTotal(0)
    } finally {
      if (seq === listAbort.current) setLoading(false)
    }
  }, [keyword, placement, status, partnerId, page, pageSize, reorderMode])

  useEffect(() => {
    void loadMetrics()
  }, [loadMetrics])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const totalPages = Math.max(1, Math.ceil(total / (reorderMode ? REORDER_PAGE_SIZE : pageSize)))

  const refreshAll = async () => {
    await Promise.all([loadMetrics(), loadList()])
  }

  const applyFilters = () => {
    const raw = partnerIdInput.trim()
    if (raw && Number.isNaN(Number(raw))) {
      showToast('매장 ID는 숫자여야 합니다.', 'error')
      return
    }
    setPartnerId(raw ? Number(raw) : undefined)
    setKeyword(keywordInput)
    setPage(1)
  }

  const resetFilters = () => {
    setKeywordInput('')
    setKeyword('')
    setPlacement('all')
    setStatus('all')
    setPartnerIdInput('')
    setPartnerId(undefined)
    setPage(1)
    setPageSize(20)
  }

  const openCreate = () => {
    setEditorMode('create')
    setEditingId(null)
    setForm(EMPTY_BANNER_FORM)
    setExistingImageUrl(null)
    setPendingFile(null)
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(null)
    setEditorOpen(true)
  }

  const openEdit = async (id: number) => {
    setEditorMode('edit')
    setEditingId(id)
    setEditorOpen(true)
    setEditorLoading(true)
    setPendingFile(null)
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(null)
    try {
      const b = await getAdminBanner(id)
      setForm({
        title: b.title,
        subtitle: b.subtitle ?? '',
        placement: b.placement as BannerPlacement,
        linkType: b.linkType as BannerFormState['linkType'],
        linkValue: b.linkValue ?? '',
        partnerId: b.partnerId != null ? String(b.partnerId) : '',
        startAt: toDatetimeLocalValue(b.startAt),
        endAt: toDatetimeLocalValue(b.endAt),
        displayOrder: String(b.displayOrder ?? 0),
      })
      setExistingImageUrl(b.imageUrl)
    } catch (e) {
      showToast(errMessage(e, '배너 상세를 불러오지 못했습니다.'), 'error')
      setEditorOpen(false)
    } finally {
      setEditorLoading(false)
    }
  }

  const onPickFile = (file: File | null) => {
    if (!file) return
    const v = validateBannerImageFile(file)
    if (v) {
      showToast(v, 'error')
      return
    }
    setPendingFile(file)
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(URL.createObjectURL(file))
  }

  const submitEditor = async () => {
    const v = validateForm(form)
    if (v) {
      showToast(v, 'error')
      return
    }
    setSubmitting(true)
    try {
      if (editorMode === 'create') {
        const created = await createBanner(buildCreatePayload(form))
        let imageOk = true
        if (pendingFile) {
          setUploading(true)
          try {
            await uploadBannerImage(created.id, pendingFile)
          } catch (e) {
            imageOk = false
            showToast(
              `배너 #${created.id}은(는) 임시저장으로 생성됐습니다. 이미지 업로드 실패: ${errMessage(e, '알 수 없는 오류')}`,
              'warning',
            )
          } finally {
            setUploading(false)
          }
        } else {
          showToast(
            `배너 #${created.id}이(가) 임시저장으로 생성됐습니다. ACTIVE/SCHEDULED 전환 전 이미지를 업로드하세요.`,
            'success',
          )
        }
        if (imageOk && pendingFile) {
          showToast('배너가 생성되고 이미지가 업로드됐습니다.', 'success')
        }
        setEditorOpen(false)
        await refreshAll()
      } else if (editingId != null) {
        const payload = buildCreatePayload(form)
        await updateBanner(editingId, {
          title: payload.title,
          subtitle: payload.subtitle,
          placement: payload.placement,
          linkType: payload.linkType,
          linkValue: payload.linkValue,
          partnerId: payload.partnerId,
          startAt: payload.startAt,
          endAt: payload.endAt,
          displayOrder: payload.displayOrder,
          clearSubtitle: !payload.subtitle,
          clearLinkValue: payload.linkType === 'NONE' || !payload.linkValue,
          clearPartnerId: payload.partnerId == null,
          clearStartAt: !payload.startAt,
          clearEndAt: !payload.endAt,
        })
        if (pendingFile) {
          setUploading(true)
          try {
            const img = await uploadBannerImage(editingId, pendingFile)
            setExistingImageUrl(img.imageUrl)
            showToast('배너가 수정되고 이미지가 교체됐습니다.', 'success')
          } catch (e) {
            showToast(
              `배너 정보는 저장됐지만 이미지 교체에 실패했습니다: ${errMessage(e, '알 수 없는 오류')}`,
              'warning',
            )
          } finally {
            setUploading(false)
          }
        } else {
          showToast('배너가 수정됐습니다.', 'success')
        }
        setEditorOpen(false)
        await refreshAll()
      }
    } catch (e) {
      showToast(errMessage(e, '저장에 실패했습니다.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const uploadOnly = async () => {
    if (editingId == null || !pendingFile) return
    const v = validateBannerImageFile(pendingFile)
    if (v) {
      showToast(v, 'error')
      return
    }
    setUploading(true)
    try {
      const img = await uploadBannerImage(editingId, pendingFile)
      setExistingImageUrl(img.imageUrl)
      setPendingFile(null)
      if (localPreview) URL.revokeObjectURL(localPreview)
      setLocalPreview(null)
      showToast('이미지가 업로드됐습니다.', 'success')
      await refreshAll()
    } catch (e) {
      showToast(errMessage(e, '이미지 업로드에 실패했습니다.'), 'error')
    } finally {
      setUploading(false)
    }
  }

  const askConfirm = (title: string, body: string, action: () => Promise<void>) => {
    setConfirmTitle(title)
    setConfirmBody(body)
    setConfirmAction(() => action)
    setConfirmOpen(true)
  }

  const runConfirm = async () => {
    if (!confirmAction) return
    setConfirmBusy(true)
    try {
      await confirmAction()
      setConfirmOpen(false)
    } catch (e) {
      showToast(errMessage(e, '처리에 실패했습니다.'), 'error')
    } finally {
      setConfirmBusy(false)
      setConfirmAction(null)
    }
  }

  const changeStatus = (row: AdminBanner, next: BannerStatus) => {
    if (next === 'ACTIVE' || next === 'SCHEDULED') {
      const fail = canActivateBanner({
        imageUrl: row.imageUrl,
        startAt: row.startAt,
        endAt: row.endAt,
      })
      if (fail) {
        showToast(fail, 'error')
        return
      }
    }
    const note =
      next === 'ACTIVE'
        ? '\n\n활성 상태로 저장되지만 시작 전에는 ‘예정’으로, 종료 후에는 ‘종료’로 표시될 수 있습니다.'
        : ''
    askConfirm(
      '상태 변경',
      `「${row.title}」 배너 상태를 ${statusLabel(next)}(으)로 변경할까요?${note}`,
      async () => {
        await updateBannerStatus(row.id, next)
        showToast('상태가 변경됐습니다.', 'success')
        await refreshAll()
      },
    )
  }

  const removeBanner = (row: AdminBanner) => {
    askConfirm(
      '배너 삭제',
      '이 배너를 삭제하시겠습니까?\n삭제된 배너는 목록과 고객앱에서 제외됩니다.\n업로드된 마지막 이미지는 서버 정책상 즉시 삭제되지 않습니다.',
      async () => {
        await deleteBanner(row.id)
        showToast('배너가 삭제됐습니다.', 'success')
        const remaining = items.length - 1
        if (remaining <= 0 && page > 1) {
          setPage((p) => Math.max(1, p - 1))
        } else {
          await refreshAll()
        }
      },
    )
  }

  const moveOrder = async (index: number, direction: -1 | 1) => {
    if (!reorderMode) return
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= items.length) return
    const sorted = [...items]
    const tmp = sorted[index]
    sorted[index] = sorted[nextIndex]
    sorted[nextIndex] = tmp
    const payload = sorted.map((b, i) => ({ id: b.id, displayOrder: i }))
    setReorderSaving(true)
    try {
      await reorderBanners(payload)
      showToast('순서가 저장됐습니다.', 'success')
      await loadList()
    } catch (e) {
      showToast(errMessage(e, '순서 변경에 실패했습니다.'), 'error')
    } finally {
      setReorderSaving(false)
    }
  }

  const previewUrl = localPreview || existingImageUrl

  const formFields = useMemo(
    () => (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">제목 *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            maxLength={200}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">부제목</label>
          <input
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            maxLength={500}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">노출 위치 *</label>
            <select
              value={form.placement}
              onChange={(e) =>
                setForm((f) => ({ ...f, placement: e.target.value as BannerPlacement }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {BANNER_PLACEMENTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">링크 유형 *</label>
            <select
              value={form.linkType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  linkType: e.target.value as BannerFormState['linkType'],
                  linkValue: e.target.value === 'NONE' ? '' : f.linkValue,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {BANNER_LINK_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {form.linkType === 'STORE' && (
          <div>
            <label className="mb-1 block text-xs text-gray-500">앱 이동용 매장 slug *</label>
            <input
              value={form.linkValue}
              onChange={(e) => setForm((f) => ({ ...f, linkValue: e.target.value }))}
              placeholder="예: sparkling"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        )}
        {form.linkType === 'EXTERNAL_URL' && (
          <div>
            <label className="mb-1 block text-xs text-gray-500">외부 링크 URL *</label>
            <input
              value={form.linkValue}
              onChange={(e) => setForm((f) => ({ ...f, linkValue: e.target.value }))}
              placeholder="https://"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">연결 매장 ID (선택)</label>
            <input
              value={form.partnerId}
              onChange={(e) => setForm((f) => ({ ...f, partnerId: e.target.value }))}
              placeholder="숫자 partnerId"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">표시 순서</label>
            <input
              type="number"
              min={0}
              value={form.displayOrder}
              onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">시작</label>
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">종료</label>
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">배너 이미지</label>
          <p className="mb-2 text-xs text-gray-400">
            권장 크기 1920×1080, 가로형 16:9. 업로드 후 WebP로 최적화됩니다. (JPEG/PNG/WebP, 최대
            5MB)
          </p>
          {editorMode === 'edit' && existingImageUrl && !localPreview && (
            <p className="mb-2 text-xs text-amber-600">
              새 이미지를 업로드하면 기존 이미지는 교체됩니다.
            </p>
          )}
          {previewUrl ? (
            <div className="mb-2 overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="미리보기"
                className="max-h-48 w-full object-contain bg-gray-50"
              />
            </div>
          ) : (
            <div className="mb-2 flex h-28 items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400">
              이미지 미리보기 없음
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              파일 선택
            </button>
            {editorMode === 'edit' && pendingFile && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => void uploadOnly()}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                {uploading ? '업로드 중…' : '이미지만 업로드'}
              </button>
            )}
          </div>
          {editorMode === 'create' && (
            <p className="mt-2 text-xs text-gray-400">
              이미지 없이 임시저장 생성 가능합니다. 활성/예약 전환 전 이미지가 필요합니다.
            </p>
          )}
        </div>
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form handlers close over latest state
    [form, editorMode, existingImageUrl, localPreview, previewUrl, uploading, pendingFile],
  )

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="배너 관리"
        description="고객앱과 웹에 노출되는 플랫폼 배너를 관리합니다."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + 배너 만들기
          </button>
        }
      />

      {metricsError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="mb-3 text-sm text-gray-500">집계를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void loadMetrics()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 xl:grid-cols-7 lg:overflow-visible">
          <div className="min-w-[140px] flex-1">
            <AdminStatCard
              icon="📋"
              label="전체"
              value={metricsLoading ? '-' : (metrics?.total ?? '-')}
              color="blue"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <AdminStatCard
              icon="✅"
              label="노출 중"
              value={metricsLoading ? '-' : (metrics?.active ?? '-')}
              color="green"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <AdminStatCard
              icon="📅"
              label="예정"
              value={metricsLoading ? '-' : (metrics?.scheduled ?? '-')}
              color="blue"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <AdminStatCard
              icon="⏸"
              label="일시정지"
              value={metricsLoading ? '-' : (metrics?.paused ?? '-')}
              color="orange"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <AdminStatCard
              icon="⏹"
              label="종료"
              value={metricsLoading ? '-' : (metrics?.ended ?? '-')}
              color="orange"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <AdminStatCard
              icon="👁"
              label="총 노출"
              value={
                metricsLoading
                  ? '-'
                  : (metrics?.totalImpressions?.toLocaleString('ko-KR') ?? '-')
              }
              color="blue"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <AdminStatCard
              icon="🖱"
              label="총 클릭"
              value={
                metricsLoading ? '-' : (metrics?.totalClicks?.toLocaleString('ko-KR') ?? '-')
              }
              color="green"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-4">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs text-gray-400">검색</label>
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilters()
            }}
            placeholder="제목, 부제목"
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">위치</label>
          <select
            value={placement}
            onChange={(e) => {
              setPlacement(e.target.value)
              setPage(1)
              if (e.target.value !== 'all') setPageSize(REORDER_PAGE_SIZE)
              else setPageSize(20)
            }}
            className="min-w-[140px] rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          >
            <option value="all">전체 위치</option>
            {BANNER_PLACEMENTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">상태</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="min-w-[120px] rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          >
            <option value="all">전체 상태</option>
            {BANNER_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">매장 ID</label>
          <input
            type="text"
            value={partnerIdInput}
            onChange={(e) => setPartnerIdInput(e.target.value)}
            placeholder="partnerId"
            className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          검색
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          초기화
        </button>
      </div>

      {reorderMode && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          동일 노출 위치({placementLabel(placement)}) 목록에서 위/아래로 순서를 변경할 수 있습니다.
          최대 {REORDER_PAGE_SIZE}건까지 한 번에 조회합니다.
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="mb-2 text-sm text-gray-700">배너 목록을 불러오지 못했습니다.</p>
          {errorDetail && <p className="mb-4 text-xs text-gray-400">{errorDetail}</p>}
          <button
            type="button"
            onClick={() => void loadList()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
            <AdminTable
              loading={loading}
              emptyMessage="등록된 배너가 없습니다. 새 배너를 만들어 고객앱에 노출해 보세요."
              columns={[
                { key: 'thumb', label: '이미지' },
                { key: 'title', label: '제목' },
                { key: 'placement', label: '위치' },
                { key: 'status', label: '상태' },
                { key: 'period', label: '노출 기간' },
                { key: 'order', label: '순서' },
                { key: 'stats', label: '노출/클릭' },
                { key: 'actions', label: '액션' },
              ]}
              data={items.map((row, index) => ({
                thumb: <BannerThumb url={row.imageUrl} alt={row.title} />,
                title: (
                  <div>
                    <EllipsisText text={row.title} className="font-medium text-gray-900" />
                    {row.subtitle && (
                      <EllipsisText text={row.subtitle} className="text-xs text-gray-400" />
                    )}
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {linkTypeLabel(row.linkType)}
                      {row.linkValue ? ` · ${row.linkValue}` : ''}
                    </p>
                  </div>
                ),
                placement: (
                  <span className="whitespace-nowrap text-sm">{placementLabel(row.placement)}</span>
                ),
                status: (
                  <div className="flex flex-col gap-1">
                    <AdminBadge
                      variant={STATUS_VARIANT[row.status] ?? 'neutral'}
                      label={`저장 ${statusLabel(row.status)}`}
                    />
                    <AdminBadge
                      variant={STATUS_VARIANT[row.effectiveStatus] ?? 'neutral'}
                      label={`현재 ${statusLabel(row.effectiveStatus)}`}
                    />
                  </div>
                ),
                period: (
                  <span className="whitespace-nowrap text-xs text-gray-600">
                    {formatAdminBannerPeriod(row.startAt, row.endAt)}
                  </span>
                ),
                order: (
                  <div className="flex items-center gap-1">
                    <span className="tabular-nums text-sm">{row.displayOrder}</span>
                    {reorderMode && (
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={reorderSaving || index === 0}
                          onClick={() => void moveOrder(index, -1)}
                          className="px-1 text-xs disabled:opacity-30"
                          title="위로"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={reorderSaving || index === items.length - 1}
                          onClick={() => void moveOrder(index, 1)}
                          className="px-1 text-xs disabled:opacity-30"
                          title="아래로"
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </div>
                ),
                stats: (
                  <span className="tabular-nums text-sm">
                    {row.impressionCount.toLocaleString('ko-KR')} /{' '}
                    {row.clickCount.toLocaleString('ko-KR')}
                  </span>
                ),
                actions: (
                  <div className="flex flex-col items-start gap-1">
                    <button
                      type="button"
                      onClick={() => void openEdit(row.id)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      수정
                    </button>
                    {statusActionsFor(row.status).map((a) => (
                      <button
                        key={a.status}
                        type="button"
                        onClick={() => changeStatus(row, a.status)}
                        className="text-sm text-slate-600 hover:underline"
                      >
                        {a.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => removeBanner(row)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                ),
              }))}
            />
            {!reorderMode && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">
                  총 {total.toLocaleString('ko-KR')}건 · {page}/{totalPages} 페이지
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
            {reorderMode && (
              <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
                총 {total.toLocaleString('ko-KR')}건
                {total > REORDER_PAGE_SIZE
                  ? ` (순서 변경은 상위 ${REORDER_PAGE_SIZE}건만 표시)`
                  : ''}
              </div>
            )}
          </div>

          <div className="space-y-3 md:hidden">
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
                불러오는 중…
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p className="text-sm text-gray-700">등록된 배너가 없습니다.</p>
                <p className="mt-1 text-xs text-gray-400">
                  새 배너를 만들어 고객앱에 노출해 보세요.
                </p>
              </div>
            ) : (
              items.map((row, index) => (
                <div
                  key={row.id}
                  className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <BannerThumb url={row.imageUrl} alt={row.title} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{row.title}</p>
                      {row.subtitle && (
                        <p className="truncate text-xs text-gray-400">{row.subtitle}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">{placementLabel(row.placement)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <AdminBadge
                      variant={STATUS_VARIANT[row.status] ?? 'neutral'}
                      label={`저장 ${statusLabel(row.status)}`}
                    />
                    <AdminBadge
                      variant={STATUS_VARIANT[row.effectiveStatus] ?? 'neutral'}
                      label={`현재 ${statusLabel(row.effectiveStatus)}`}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatAdminBannerPeriod(row.startAt, row.endAt)}
                  </p>
                  <p className="text-xs text-gray-400">
                    순서 {row.displayOrder} · 노출 {row.impressionCount} · 클릭 {row.clickCount}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void openEdit(row.id)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                    >
                      수정
                    </button>
                    {statusActionsFor(row.status).map((a) => (
                      <button
                        key={a.status}
                        type="button"
                        onClick={() => changeStatus(row, a.status)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                      >
                        {a.label}
                      </button>
                    ))}
                    {reorderMode && (
                      <>
                        <button
                          type="button"
                          disabled={reorderSaving || index === 0}
                          onClick={() => void moveOrder(index, -1)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
                        >
                          위로
                        </button>
                        <button
                          type="button"
                          disabled={reorderSaving || index === items.length - 1}
                          onClick={() => void moveOrder(index, 1)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
                        >
                          아래로
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removeBanner(row)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
            {!reorderMode && items.length > 0 && (
              <div className="flex items-center justify-between px-1 py-2">
                <p className="text-xs text-gray-400">
                  {page}/{totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <AdminModal
        open={editorOpen}
        onClose={() => {
          if (submitting || uploading) return
          setEditorOpen(false)
        }}
        title={editorMode === 'create' ? '배너 만들기' : `배너 수정 #${editingId ?? ''}`}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={submitting || uploading}
              onClick={() => setEditorOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              disabled={submitting || uploading || editorLoading}
              onClick={() => void submitEditor()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting || uploading ? '저장 중…' : editorMode === 'create' ? '생성' : '저장'}
            </button>
          </div>
        }
      >
        {editorLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>
        ) : (
          formFields
        )}
      </AdminModal>

      <AdminModal
        open={confirmOpen}
        onClose={() => {
          if (confirmBusy) return
          setConfirmOpen(false)
          setConfirmAction(null)
        }}
        title={confirmTitle}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={confirmBusy}
              onClick={() => {
                setConfirmOpen(false)
                setConfirmAction(null)
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              disabled={confirmBusy}
              onClick={() => void runConfirm()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {confirmBusy ? '처리 중…' : '확인'}
            </button>
          </div>
        }
      >
        <p className="whitespace-pre-line text-sm text-gray-700">{confirmBody}</p>
      </AdminModal>
    </div>
  )
}
