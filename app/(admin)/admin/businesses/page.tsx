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
import {
  fetchAdminAllBusinesses,
  fetchAdminPartnerDetail,
  formatAdminPermissionError,
  updateBusinessStatus,
  type AdminPartnerDetail,
  type AdminPartnerListItem,
  type AdminPartnerSummary,
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

export default function AdminBusinessesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast, ToastComponent } = useToast()

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
    })
  }, [kpi, bizType, planTier, coords, sort, search, page, pageSize, syncUrl])

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
  }, [search, bizType, planTier, page, pageSize, sort, kpi, coords])

  useEffect(() => {
    void load()
  }, [load])

  const openDrawer = async (id: string) => {
    setDrawerLoading(true)
    try {
      const detail = await fetchAdminPartnerDetail(id)
      setDrawer(detail)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '상세 정보를 불러오지 못했습니다.', 'error')
    } finally {
      setDrawerLoading(false)
    }
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
              setPage(1)
              setPageSize(30)
            }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
          >
            초기화
          </button>
        </div>
        <p className="text-xs text-gray-500">
          총 {total.toLocaleString()}건 · 서버 페이지네이션 · URL 필터 동기화
        </p>
      </div>

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
            columns={[
              { key: 'name', label: '업체명' },
              { key: 'bizType', label: '업종', width: '90px' },
              { key: 'region', label: '지역', width: '70px' },
              { key: 'status', label: '상태', width: '90px' },
              { key: 'plan', label: '플랜', width: '90px' },
              { key: 'distributor', label: '총판', width: '100px' },
              { key: 'agency', label: '영업점', width: '100px' },
              { key: 'agent', label: '영업사원', width: '100px' },
              { key: 'lastLogin', label: '최근 로그인', width: '100px' },
              { key: 'recentReservations', label: '최근 예약', width: '80px' },
              { key: 'createdAt', label: '가입일', width: '100px' },
              { key: 'coords', label: '좌표', width: '80px' },
              { key: 'actions', label: '작업', width: '150px' },
            ]}
            data={businesses.map((b) => ({
              ...b,
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
              status: (
                <AdminBadge
                  label={BUSINESS_STATUS_LABEL[b.status] ?? b.status}
                  variant={BUSINESS_STATUS_VARIANT[b.status] ?? 'neutral'}
                />
              ),
              actions: (
                <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                  <ActionBtn label="상세" onClick={() => void openDrawer(b.id)} />
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
                        label="복구"
                        onClick={() =>
                          setConfirm({
                            business: b,
                            title: '업체 복구',
                            message: `${b.name} 업체를 복구하시겠습니까?`,
                            nextStatus: 'active',
                            variant: 'primary',
                          })
                        }
                      />
                    </PermissionGate>
                  )}
                </div>
              ),
            }))}
            onRowClick={(row) => void openDrawer(String(row.id))}
            emptyMessage="조건에 맞는 업체가 없습니다."
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              {page}/{totalPages}페이지
            </span>
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
              <button
                type="button"
                disabled
                title="다음 단계에서 구현"
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-400 cursor-not-allowed"
              >
                삭제(준비중)
              </button>
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
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">운영 메모</p>
              <p className="text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-3">
                파트너 전용 메모 테이블/컬럼이 없어 이번 단계에서는 기반만 준비했습니다. (migration 보류)
              </p>
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
