'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import AdminTable from '@/components/admin/AdminTable'
import {
  fetchAdminFranchiseDetail,
  fetchAdminFranchisePartners,
  fetchAdminPartners,
  linkAdminFranchisePartner,
  unlinkAdminFranchisePartner,
  updateAdminFranchise,
  updateAdminFranchiseStatus,
  type AdminFranchiseDetailBundle,
  type AdminFranchisePartnerItem,
  type FranchiseStatus,
} from '@/lib/admin-api'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '운영중',
  PAUSED: '일시중지',
  ENDED: '종료',
}

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function AdminFranchiseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')
  const [data, setData] = useState<AdminFranchiseDetailBundle | null>(null)
  const [partners, setPartners] = useState<AdminFranchisePartnerItem[]>([])
  const [partnerOptions, setPartnerOptions] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [hqConfirmOpen, setHqConfirmOpen] = useState(false)
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [linkRole, setLinkRole] = useState<'BRANCH' | 'HEADQUARTERS'>('BRANCH')
  const [partnerKeyword, setPartnerKeyword] = useState('')
  const [editForm, setEditForm] = useState({
    name: '',
    memo: '',
    representativeName: '',
    contactPhone: '',
    contactEmail: '',
    headquartersPartnerId: '',
  })
  const [pendingHqId, setPendingHqId] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [bundle, list] = await Promise.all([
        fetchAdminFranchiseDetail(id),
        fetchAdminFranchisePartners(id, { keyword: partnerKeyword || undefined, pageSize: 50 }),
      ])
      setData(bundle)
      setPartners(list.items)
      setEditForm({
        name: bundle.franchise.name,
        memo: bundle.franchise.memo || '',
        representativeName: bundle.franchise.representativeName || '',
        contactPhone: bundle.franchise.contactPhone || '',
        contactEmail: bundle.franchise.contactEmail || '',
        headquartersPartnerId: bundle.franchise.headquartersPartnerId || '',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '상세를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [id, partnerKeyword])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void fetchAdminPartners()
      .then((rows) => setPartnerOptions(rows.map((p) => ({ id: p.id, name: p.name }))))
      .catch(() => setPartnerOptions([]))
  }, [])

  const handleLink = async () => {
    if (!selectedPartnerId) return
    try {
      await linkAdminFranchisePartner(id, {
        partnerId: Number(selectedPartnerId),
        role: linkRole,
      })
      setLinkOpen(false)
      setSelectedPartnerId('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '연결에 실패했습니다.')
    }
  }

  const handleUnlink = async (partnerId: string) => {
    if (!window.confirm('이 가맹점 연결을 해제할까요? 예약·매출 데이터는 유지됩니다.')) return
    try {
      await unlinkAdminFranchisePartner(id, partnerId)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '연결 해제에 실패했습니다.')
    }
  }

  const saveEdit = async (hqId: string | null) => {
    try {
      await updateAdminFranchise(id, {
        name: editForm.name,
        memo: editForm.memo || null,
        representativeName: editForm.representativeName || null,
        contactPhone: editForm.contactPhone || null,
        contactEmail: editForm.contactEmail || null,
        headquartersPartnerId: hqId ? Number(hqId) : null,
      })
      setEditOpen(false)
      setHqConfirmOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '수정에 실패했습니다.')
    }
  }

  if (loading && !data) {
    return <p className="text-sm text-gray-400">불러오는 중...</p>
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-500">{error || '프랜차이즈를 찾을 수 없습니다.'}</p>
        <button type="button" className="text-sm text-blue-600" onClick={() => router.push('/admin/franchises')}>
          목록으로
        </button>
      </div>
    )
  }

  const f = data.franchise
  const s = data.summary

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={f.name}
        description="프랜차이즈 상세 · 가맹점 연결"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/franchises" className="text-sm px-3 py-1.5 border rounded-lg">
              목록
            </Link>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="text-sm px-3 py-1.5 border rounded-lg"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => setLinkOpen(true)}
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg"
            >
              가맹점 추가
            </button>
            {f.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => void updateAdminFranchiseStatus(id, 'PAUSED').then(load)}
                className="text-sm px-3 py-1.5 border rounded-lg text-amber-600"
              >
                일시중지
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void updateAdminFranchiseStatus(id, 'ACTIVE' as FranchiseStatus).then(load)}
                className="text-sm px-3 py-1.5 border rounded-lg text-green-600"
              >
                운영 재개
              </button>
            )}
          </div>
        }
      />

      {error ? <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div> : null}

      <div className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">상태</p>
          <AdminBadge label={STATUS_LABEL[f.status] ?? f.status} variant="info" />
        </div>
        <div>
          <p className="text-gray-500">본부 업체</p>
          <p className="font-medium">{f.headquartersName || '미지정'}</p>
        </div>
        <div>
          <p className="text-gray-500">대표자</p>
          <p>{f.representativeName || '-'}</p>
        </div>
        <div>
          <p className="text-gray-500">연락처</p>
          <p>{f.contactPhone || '-'} / {f.contactEmail || '-'}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-gray-500">메모</p>
          <p>{f.memo || '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminStatCard icon="🏪" label="가맹점" value={s.totalPartners} color="blue" />
        <AdminStatCard icon="🟢" label="활성" value={s.activePartners} color="green" />
        <AdminStatCard icon="📅" label="오늘 예약" value={s.todayReservations} color="orange" />
        <AdminStatCard icon="📆" label="월 예약" value={s.monthReservations} color="blue" />
        <AdminStatCard icon="💵" label="오늘 매출" value={formatMoney(s.todayRevenue)} color="green" />
        <AdminStatCard icon="💰" label="월 매출" value={formatMoney(s.monthRevenue)} color="purple" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">가맹점 목록</h2>
          <input
            value={partnerKeyword}
            onChange={(e) => setPartnerKeyword(e.target.value)}
            placeholder="가맹점 검색"
            className="text-sm border rounded-lg px-3 py-1.5"
          />
        </div>
        <div className="bg-white border rounded-xl overflow-hidden">
          <AdminTable
            loading={loading}
            columns={[
              { key: 'name', label: '업체' },
              { key: 'role', label: '역할', width: '100px' },
              { key: 'status', label: '상태', width: '90px' },
              { key: 'today', label: '오늘', width: '70px' },
              { key: 'month', label: '월매출', width: '110px' },
              { key: 'actions', label: '', width: '140px' },
            ]}
            data={partners.map((p) => ({
              name: (
                <div>
                  <p className="font-medium">{p.businessName}</p>
                  <p className="text-xs text-gray-500">{p.region || p.bizType || '-'}</p>
                </div>
              ),
              role: <span className="text-xs">{p.role === 'HEADQUARTERS' ? '본부' : '가맹'}</span>,
              status: <AdminBadge label={p.partnerStatus} variant="neutral" />,
              today: p.todayReservations,
              month: formatMoney(p.monthRevenue),
              actions: (
                <div className="flex gap-2 text-sm">
                  <Link href={`/admin/businesses/${p.partnerId}`} className="text-blue-600">
                    업체
                  </Link>
                  <button
                    type="button"
                    className="text-red-500"
                    onClick={() => void handleUnlink(p.partnerId)}
                  >
                    해제
                  </button>
                </div>
              ),
            }))}
            emptyMessage="연결된 가맹점이 없습니다."
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">최근 예약</h2>
        <div className="bg-white border rounded-xl divide-y">
          {data.recentReservations.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-6">최근 예약이 없습니다.</p>
          ) : (
            data.recentReservations.map((r) => (
              <div key={r.id} className="px-4 py-3 text-sm flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium">{r.businessName}</p>
                  <p className="text-gray-500">
                    {r.bookingDate} {r.startTime || ''} · {r.customerName || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p>{r.status}</p>
                  <p className="text-gray-600">{formatMoney(r.price)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AdminModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="가맹점 추가"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-1.5 border rounded-lg text-sm" onClick={() => setLinkOpen(false)}>
              취소
            </button>
            <button
              type="button"
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              onClick={() => void handleLink()}
            >
              연결
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <label className="block space-y-1">
            <span>업체 선택</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
            >
              <option value="">선택</option>
              {partnerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span>역할</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={linkRole}
              onChange={(e) => setLinkRole(e.target.value as 'BRANCH' | 'HEADQUARTERS')}
            >
              <option value="BRANCH">가맹점</option>
              <option value="HEADQUARTERS">본부</option>
            </select>
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="프랜차이즈 수정"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-1.5 border rounded-lg text-sm" onClick={() => setEditOpen(false)}>
              취소
            </button>
            <button
              type="button"
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              onClick={() => {
                if (
                  editForm.headquartersPartnerId !== (f.headquartersPartnerId || '') &&
                  editForm.headquartersPartnerId
                ) {
                  setPendingHqId(editForm.headquartersPartnerId)
                  setHqConfirmOpen(true)
                  return
                }
                void saveEdit(editForm.headquartersPartnerId || null)
              }}
            >
              저장
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <label className="space-y-1 md:col-span-2">
            <span>이름</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={editForm.name}
              onChange={(e) => setEditForm((x) => ({ ...x, name: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span>대표자</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={editForm.representativeName}
              onChange={(e) => setEditForm((x) => ({ ...x, representativeName: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span>연락처</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={editForm.contactPhone}
              onChange={(e) => setEditForm((x) => ({ ...x, contactPhone: e.target.value }))}
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span>본부 업체</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={editForm.headquartersPartnerId}
              onChange={(e) => setEditForm((x) => ({ ...x, headquartersPartnerId: e.target.value }))}
            >
              <option value="">미지정</option>
              {partnerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 md:col-span-2">
            <span>메모</span>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              value={editForm.memo}
              onChange={(e) => setEditForm((x) => ({ ...x, memo: e.target.value }))}
            />
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={hqConfirmOpen}
        onClose={() => setHqConfirmOpen(false)}
        title="본부 업체 변경"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-1.5 border rounded-lg text-sm" onClick={() => setHqConfirmOpen(false)}>
              취소
            </button>
            <button
              type="button"
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              onClick={() => void saveEdit(pendingHqId)}
            >
              변경
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">본부 업체를 변경하면 기존 본부 연결이 해제됩니다. 계속할까요?</p>
      </AdminModal>
    </div>
  )
}
