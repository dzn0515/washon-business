'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import SalesSubNav from '@/components/admin/SalesSubNav'
import { PermissionGate } from '@/components/admin/PermissionGate'
import {
  approveAdminSalesLead,
  fetchAdminSalesAgents,
  fetchAdminSalesLead,
  fetchAdminSalesLeads,
  formatAdminPermissionError,
  rejectAdminSalesLead,
  type AdminSalesAgent,
  type AdminSalesLead,
} from '@/lib/admin-api'

const STATUS_LABEL: Record<string, string> = {
  NEW: '신규',
  REVIEWING: '검토중',
  APPROVED: '승인',
  REJECTED: '반려',
  CONVERTED: '전환완료',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error'> = {
  NEW: 'neutral',
  REVIEWING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CONVERTED: 'success',
}

const PAGE_SIZE = 20

export default function AdminSalesLeadsPage() {
  const [items, setItems] = useState<AdminSalesLead[]>([])
  const [agents, setAgents] = useState<AdminSalesAgent[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [agentId, setAgentId] = useState('')
  const [businessType, setBusinessType] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminSalesLead | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [approveDoneEmail, setApproveDoneEmail] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAdminSalesLeads({
        keyword: keyword || undefined,
        status,
        agentId: agentId || undefined,
        businessType,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (e) {
      setError(formatAdminPermissionError(e, '입점 신청을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [keyword, status, agentId, businessType, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void fetchAdminSalesAgents({ pageSize: 100 })
      .then((res) => setAgents(res.items))
      .catch(() => setAgents([]))
  }, [])

  const openDetail = async (id: string) => {
    try {
      const row = await fetchAdminSalesLead(id)
      setDetail(row)
      setApproveDoneEmail(null)
      setOwnerEmail(row.email || '')
      setTempPassword('')
      setShowPassword(false)
      await load()
    } catch (e) {
      setError(formatAdminPermissionError(e, '상세 조회에 실패했습니다.'))
    }
  }

  const handleApprove = async () => {
    if (!detail) return
    if (!ownerEmail.trim() || tempPassword.trim().length < 6) {
      setError('Owner 이메일과 임시 비밀번호(최소 6자)를 입력하세요.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await approveAdminSalesLead(detail.id, {
        ownerEmail: ownerEmail.trim(),
        temporaryPassword: tempPassword.trim(),
      })
      setApproveDoneEmail(res.ownerLoginEmail || ownerEmail.trim())
      setDetail(res)
      setApproveOpen(false)
      // keep password only in local modal state until close; do not persist from API
      await load()
    } catch (e) {
      setError(formatAdminPermissionError(e, '승인에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const copyPassword = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('클립보드 복사에 실패했습니다.')
    }
  }

  const openApproveModal = () => {
    if (!detail) return
    setOwnerEmail(detail.email || ownerEmail)
    setApproveOpen(true)
  }

  const handleReject = async () => {
    if (!detail || !rejectReason.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await rejectAdminSalesLead(detail.id, rejectReason.trim())
      setDetail(res)
      setRejectOpen(false)
      setRejectReason('')
      await load()
    } catch (e) {
      setError(formatAdminPermissionError(e, '반려에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const canReview =
    detail &&
    (detail.status === 'NEW' || detail.status === 'REVIEWING' || detail.status === 'APPROVED')

  const tableData = useMemo(
    () =>
      items.map((row) => ({
        company: (
          <div>
            <p className="font-medium text-gray-900">{row.companyName}</p>
            <p className="text-xs text-gray-500">{row.ownerName}</p>
          </div>
        ),
        agent: <span className="text-sm">{row.salesAgentName || '-'}</span>,
        contact: (
          <div className="text-sm">
            <p>{row.phone}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        ),
        biz: <span className="text-sm">{row.businessType}</span>,
        status: (
          <AdminBadge
            label={STATUS_LABEL[row.status] ?? row.status}
            variant={STATUS_VARIANT[row.status] ?? 'neutral'}
          />
        ),
        created: (
          <span className="text-sm">{new Date(row.createdAt).toLocaleDateString('ko-KR')}</span>
        ),
        actions: (
          <button
            type="button"
            className="text-sm text-blue-600"
            onClick={() => void openDetail(row.id)}
          >
            상세
          </button>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="영업 입점 신청"
        description="영업사원 입점 Lead를 검토하고 승인 시 Partner를 생성합니다"
      />
      <SalesSubNav />

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={keyword}
          onChange={(e) => {
            setPage(1)
            setKeyword(e.target.value)
          }}
          placeholder="업체·대표·연락처 검색"
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
          <option value="NEW">신규</option>
          <option value="REVIEWING">검토중</option>
          <option value="REJECTED">반려</option>
          <option value="CONVERTED">전환완료</option>
        </select>
        <select
          value={agentId}
          onChange={(e) => {
            setPage(1)
            setAgentId(e.target.value)
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          <option value="">전체 영업사원</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={businessType}
          onChange={(e) => {
            setPage(1)
            setBusinessType(e.target.value)
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          <option value="all">전체 업종</option>
          <option value="wash">세차</option>
          <option value="detailing">디테일링</option>
          <option value="tire">타이어</option>
          <option value="etc">기타</option>
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          새로고침
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <AdminTable
          loading={loading}
          columns={[
            { key: 'company', label: '업체' },
            { key: 'agent', label: '영업사원', width: '120px' },
            { key: 'contact', label: '연락처' },
            { key: 'biz', label: '업종', width: '90px' },
            { key: 'status', label: '상태', width: '100px' },
            { key: 'created', label: '신청일', width: '110px' },
            { key: 'actions', label: '', width: '80px' },
          ]}
          data={tableData}
          emptyMessage="입점 신청이 없습니다."
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
        open={!!detail}
        onClose={() => setDetail(null)}
        title="입점 신청 상세"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setDetail(null)}
            >
              닫기
            </button>
            {canReview ? (
              <PermissionGate menuKey="sales_leads" action="approve">
                <button
                  type="button"
                  className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm"
                  onClick={() => setRejectOpen(true)}
                >
                  반려
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
                  disabled={!detail.email?.trim()}
                  onClick={openApproveModal}
                >
                  승인
                </button>
              </PermissionGate>
            ) : null}
          </div>
        }
      >
        {detail ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">업체명</p>
                <p className="font-medium">{detail.companyName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">상태</p>
                <AdminBadge
                  label={STATUS_LABEL[detail.status] ?? detail.status}
                  variant={STATUS_VARIANT[detail.status] ?? 'neutral'}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">대표자</p>
                <p>{detail.ownerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">영업사원</p>
                <p>{detail.salesAgentName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">연락처</p>
                <p>
                  {detail.phone} / {detail.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">업종</p>
                <p>{detail.businessType}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500">주소</p>
                <p>{detail.address || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500">메모</p>
                <p>{detail.memo || '-'}</p>
              </div>
              {detail.rejectionReason ? (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500">반려 사유</p>
                  <p className="text-red-600">{detail.rejectionReason}</p>
                </div>
              ) : null}
              {detail.partnerCreated ? (
                <div className="md:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 space-y-1">
                  <p>업체 생성 완료</p>
                  <p className="text-xs">
                    Partner: {detail.partnerName || detail.companyName} / slug:{' '}
                    {detail.partnerSlug || '-'} / id: {detail.partnerId}
                  </p>
                  <p className="text-xs">
                    Owner 로그인 이메일: {detail.ownerLoginEmail || detail.email}
                  </p>
                </div>
              ) : null}
              {approveDoneEmail ? (
                <div className="md:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800 text-xs">
                  승인 완료. Owner 로그인 이메일: {approveDoneEmail}. 임시 비밀번호는 입력하신
                  값이며 API/재조회로 다시 확인할 수 없습니다.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="입점 승인"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setApproveOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={
                saving || !ownerEmail.trim() || tempPassword.trim().length < 6
              }
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
              onClick={() => void handleApprove()}
            >
              {saving ? '처리 중...' : '최종 승인'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-gray-600">
            승인 시 Owner 계정·ACTIVE Partner·무료체험 구독·영업사원 배정이 생성됩니다.
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            승인 후 임시 비밀번호는 다시 조회할 수 없습니다. 전달 전에 복사해 두세요.
          </p>
          <label className="block space-y-1">
            <span className="text-gray-600">Owner 로그인 이메일 *</span>
            <input
              type="email"
              autoComplete="off"
              className="w-full border rounded-lg px-3 py-2"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-gray-600">임시 비밀번호 * (최소 6자)</span>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full border rounded-lg px-3 py-2"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
              />
              <button
                type="button"
                className="px-2 border rounded-lg text-xs whitespace-nowrap"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? '숨김' : '표시'}
              </button>
              <button
                type="button"
                className="px-2 border rounded-lg text-xs whitespace-nowrap"
                disabled={!tempPassword}
                onClick={() => void copyPassword()}
              >
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="입점 반려"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setRejectOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving || !rejectReason.trim()}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm disabled:opacity-40"
              onClick={() => void handleReject()}
            >
              {saving ? '처리 중...' : '반려'}
            </button>
          </div>
        }
      >
        <label className="block text-sm space-y-1">
          <span className="text-gray-600">반려 사유 *</span>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </label>
      </AdminModal>
    </div>
  )
}
