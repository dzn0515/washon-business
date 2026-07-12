'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import {
  createAdminFranchise,
  fetchAdminFranchiseMetrics,
  fetchAdminFranchises,
  fetchAdminPartners,
  updateAdminFranchiseStatus,
  type AdminFranchiseListItem,
  type AdminFranchiseMetrics,
  type FranchiseStatus,
} from '@/lib/admin-api'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '운영중',
  PAUSED: '일시중지',
  ENDED: '종료',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  ENDED: 'neutral',
}

const PAGE_SIZE = 20

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function AdminFranchisesPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminFranchiseListItem[]>([])
  const [metrics, setMetrics] = useState<AdminFranchiseMetrics | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [partners, setPartners] = useState<Array<{ id: string; name: string }>>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    representativeName: '',
    businessNumber: '',
    contactPhone: '',
    contactEmail: '',
    memo: '',
    status: 'ACTIVE' as FranchiseStatus,
    headquartersPartnerId: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, m] = await Promise.all([
        fetchAdminFranchises({
          keyword: keyword || undefined,
          status,
          page,
          pageSize: PAGE_SIZE,
        }),
        fetchAdminFranchiseMetrics(),
      ])
      setItems(list.items)
      setTotal(list.total)
      setTotalPages(list.totalPages)
      setMetrics(m)
    } catch (e) {
      setError(e instanceof Error ? e.message : '프랜차이즈를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [keyword, status, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void fetchAdminPartners()
      .then((rows) => setPartners(rows.map((p) => ({ id: p.id, name: p.name }))))
      .catch(() => setPartners([]))
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const created = await createAdminFranchise({
        name: form.name.trim(),
        representativeName: form.representativeName || null,
        businessNumber: form.businessNumber || null,
        contactPhone: form.contactPhone || null,
        contactEmail: form.contactEmail || null,
        memo: form.memo || null,
        status: form.status,
        headquartersPartnerId: form.headquartersPartnerId
          ? Number(form.headquartersPartnerId)
          : null,
      })
      setCreateOpen(false)
      setForm({
        name: '',
        representativeName: '',
        businessNumber: '',
        contactPhone: '',
        contactEmail: '',
        memo: '',
        status: 'ACTIVE',
        headquartersPartnerId: '',
      })
      router.push(`/admin/franchises/${created.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = async (id: string, next: FranchiseStatus) => {
    try {
      await updateAdminFranchiseStatus(id, next)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    }
  }

  const tableData = useMemo(
    () =>
      items.map((row) => ({
        _id: row.id,
        name: (
          <div className="flex items-center gap-2">
            {row.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.logoUrl} alt="" className="w-8 h-8 rounded object-cover" />
            ) : (
              <span className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs">
                🏢
              </span>
            )}
            <div>
              <p className="font-medium text-gray-900">{row.name}</p>
              <p className="text-xs text-gray-500">{row.headquartersName || '본부 미지정'}</p>
            </div>
          </div>
        ),
        partners: (
          <span className="text-sm">
            {row.activePartnerCount}/{row.partnerCount}
          </span>
        ),
        status: (
          <AdminBadge
            label={STATUS_LABEL[row.status] ?? row.status}
            variant={STATUS_VARIANT[row.status] ?? 'neutral'}
          />
        ),
        today: <span className="text-sm">{row.todayReservations}</span>,
        month: <span className="text-sm">{formatMoney(row.monthRevenue)}</span>,
        actions: (
          <div className="flex gap-2">
            <button
              type="button"
              className="text-sm text-blue-600"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/admin/franchises/${row.id}`)
              }}
            >
              상세
            </button>
            {row.status === 'ACTIVE' ? (
              <button
                type="button"
                className="text-sm text-amber-600"
                onClick={(e) => {
                  e.stopPropagation()
                  void handleStatus(row.id, 'PAUSED')
                }}
              >
                중지
              </button>
            ) : row.status === 'PAUSED' ? (
              <button
                type="button"
                className="text-sm text-green-600"
                onClick={(e) => {
                  e.stopPropagation()
                  void handleStatus(row.id, 'ACTIVE')
                }}
              >
                재개
              </button>
            ) : null}
          </div>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="프랜차이즈"
        description="본부 등록과 가맹점 연결을 관리합니다"
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            + 프랜차이즈 등록
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminStatCard icon="🏢" label="전체" value={metrics?.totalFranchises ?? 0} color="blue" />
        <AdminStatCard icon="✅" label="운영중" value={metrics?.activeFranchises ?? 0} color="green" />
        <AdminStatCard icon="🏪" label="전체 가맹점" value={metrics?.totalPartners ?? 0} color="blue" />
        <AdminStatCard icon="🟢" label="활성 가맹점" value={metrics?.activePartners ?? 0} color="green" />
        <AdminStatCard icon="📅" label="오늘 예약" value={metrics?.todayReservations ?? 0} color="orange" />
        <AdminStatCard
          icon="💰"
          label="월 매출"
          value={formatMoney(metrics?.monthRevenue ?? 0)}
          color="purple"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={keyword}
          onChange={(e) => {
            setPage(1)
            setKeyword(e.target.value)
          }}
          placeholder="프랜차이즈명 검색"
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value)
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          <option value="all">전체 상태</option>
          <option value="ACTIVE">운영중</option>
          <option value="PAUSED">일시중지</option>
          <option value="ENDED">종료</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setKeyword('')
            setStatus('all')
            setPage(1)
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          새로고침
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg flex justify-between gap-3">
          <span>{error}</span>
          <button type="button" className="underline" onClick={() => void load()}>
            재시도
          </button>
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <AdminTable
          loading={loading}
          columns={[
            { key: 'name', label: '프랜차이즈' },
            { key: 'partners', label: '가맹점', width: '90px' },
            { key: 'status', label: '상태', width: '100px' },
            { key: 'today', label: '오늘예약', width: '90px' },
            { key: 'month', label: '월매출', width: '120px' },
            { key: 'actions', label: '', width: '120px' },
          ]}
          data={tableData}
          emptyMessage="등록된 프랜차이즈가 없습니다."
          onRowClick={(row) => router.push(`/admin/franchises/${String(row._id)}`)}
        />
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
          >
            이전
          </button>
          <span>
            {page} / {totalPages} · 총 {total}건
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
          >
            다음
          </button>
        </div>
      ) : null}

      <AdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="프랜차이즈 등록"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving || !form.name.trim()}
              onClick={() => void handleCreate()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
            >
              {saving ? '저장 중...' : '등록'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <label className="space-y-1 md:col-span-2">
            <span className="text-gray-600">프랜차이즈명 *</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">대표자명</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.representativeName}
              onChange={(e) => setForm((f) => ({ ...f, representativeName: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">사업자번호</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.businessNumber}
              onChange={(e) => setForm((f) => ({ ...f, businessNumber: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">연락처</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">이메일</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">상태</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as FranchiseStatus }))
              }
            >
              <option value="ACTIVE">운영중</option>
              <option value="PAUSED">일시중지</option>
              <option value="ENDED">종료</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">본부 업체</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.headquartersPartnerId}
              onChange={(e) => setForm((f) => ({ ...f, headquartersPartnerId: e.target.value }))}
            >
              <option value="">선택 안 함</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-gray-600">메모</span>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              value={form.memo}
              onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            />
          </label>
        </div>
      </AdminModal>
    </div>
  )
}
