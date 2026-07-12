'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import SalesSubNav from '@/components/admin/SalesSubNav'
import {
  createAdminSalesAgent,
  createAdminSalesAgentAccount,
  deleteAdminSalesAgent,
  fetchAdminSalesAgencies,
  fetchAdminSalesAgentAccount,
  fetchAdminSalesAgents,
  fetchAdminSalesDistributors,
  resetAdminSalesAgentAccountPassword,
  updateAdminSalesAgent,
  updateAdminSalesAgentAccountStatus,
  updateAdminSalesAgentStatus,
  type AdminSalesAgency,
  type AdminSalesAgent,
  type AdminSalesAgentAccount,
  type AdminSalesDistributor,
  type SalesEmploymentType,
  type SalesOrgStatus,
} from '@/lib/admin-api'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '정지',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'error',
}

const ACCOUNT_STATUS_LABEL: Record<string, string> = {
  NONE: '미발급',
  ACTIVE: '활성',
  INACTIVE: '비활성',
}

const ACCOUNT_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error'> = {
  NONE: 'neutral',
  ACTIVE: 'success',
  INACTIVE: 'warning',
}

const EMPLOYMENT_LABEL: Record<string, string> = {
  DIRECT: '본사 직속',
  DISTRIBUTOR: '총판 직속',
  AGENCY: '영업점',
  FREELANCER: '프리랜서',
}

const PAGE_SIZE = 20

const EMPTY_FORM = {
  name: '',
  code: '',
  phone: '',
  email: '',
  status: 'ACTIVE' as SalesOrgStatus,
  employmentType: 'DIRECT' as SalesEmploymentType,
  distributorId: '',
  agencyId: '',
  joinedAt: '',
  memo: '',
}

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('ko-KR')
}

export default function AdminSalesAgentsPage() {
  const [items, setItems] = useState<AdminSalesAgent[]>([])
  const [distributors, setDistributors] = useState<AdminSalesDistributor[]>([])
  const [agencies, setAgencies] = useState<AdminSalesAgency[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [employmentType, setEmploymentType] = useState('all')
  const [distributorId, setDistributorId] = useState('')
  const [agencyId, setAgencyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminSalesAgent | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<AdminSalesAgent | null>(null)

  const [account, setAccount] = useState<AdminSalesAgentAccount | null>(null)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [issueEmail, setIssueEmail] = useState('')
  const [issuePassword, setIssuePassword] = useState('')
  const [showIssuePassword, setShowIssuePassword] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [statusConfirm, setStatusConfirm] = useState<'deactivate' | 'activate' | null>(null)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [copied, setCopied] = useState<'issue' | 'reset' | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchAdminSalesAgents({
        keyword: keyword || undefined,
        status,
        employmentType,
        distributorId: distributorId || undefined,
        agencyId: agencyId || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(list.items)
      setTotal(list.total)
      setTotalPages(list.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '영업사원을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [keyword, status, employmentType, distributorId, agencyId, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void fetchAdminSalesDistributors({ pageSize: 100 })
      .then((res) => setDistributors(res.items))
      .catch(() => setDistributors([]))
  }, [])

  const formDistributorId = form.distributorId

  useEffect(() => {
    const distId = formOpen ? formDistributorId : distributorId
    if (!distId) {
      setAgencies([])
      return
    }
    void fetchAdminSalesAgencies({ distributorId: distId, pageSize: 100 })
      .then((res) => setAgencies(res.items))
      .catch(() => setAgencies([]))
  }, [distributorId, formDistributorId, formOpen])

  const resetAccountForm = () => {
    setAccount(null)
    setAccountError(null)
    setAccountLoading(false)
    setIssueEmail('')
    setIssuePassword('')
    setShowIssuePassword(false)
    setResetPassword('')
    setShowResetPassword(false)
    setStatusConfirm(null)
    setResetConfirmOpen(false)
    setCopied(null)
  }

  const loadAccount = async (agentId: string) => {
    setAccountLoading(true)
    setAccountError(null)
    try {
      const res = await fetchAdminSalesAgentAccount(agentId)
      setAccount(res)
      if (!res.hasAccount) {
        setIssueEmail('')
        setIssuePassword('')
      }
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : '계정 정보를 불러오지 못했습니다.')
      setAccount(null)
    } finally {
      setAccountLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    resetAccountForm()
    setForm({
      ...EMPTY_FORM,
      distributorId: distributorId || '',
      agencyId: agencyId || '',
    })
    setFormOpen(true)
  }

  const openEdit = (row: AdminSalesAgent) => {
    setEditing(row)
    resetAccountForm()
    setForm({
      name: row.name,
      code: row.code,
      phone: row.phone || '',
      email: row.email || '',
      status: (row.status as SalesOrgStatus) || 'ACTIVE',
      employmentType: (row.employmentType as SalesEmploymentType) || 'DIRECT',
      distributorId: row.distributorId || '',
      agencyId: row.agencyId || '',
      joinedAt: row.joinedAt || '',
      memo: row.memo || '',
    })
    setIssueEmail(row.accountEmail || row.email || '')
    setFormOpen(true)
    void loadAccount(row.id)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) return
    setSaving(true)
    setError(null)
    try {
      const body = {
        name: form.name.trim(),
        code: form.code.trim(),
        phone: form.phone || null,
        email: form.email || null,
        employmentType: form.employmentType,
        distributorId: form.distributorId ? Number(form.distributorId) : null,
        agencyId: form.agencyId ? Number(form.agencyId) : null,
        joinedAt: form.joinedAt || null,
        memo: form.memo || null,
      }
      if (editing) {
        await updateAdminSalesAgent(editing.id, body)
      } else {
        await createAdminSalesAgent({ ...body, status: form.status })
      }
      setFormOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = async (id: string, next: SalesOrgStatus) => {
    try {
      await updateAdminSalesAgentStatus(id, next)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteAdminSalesAgent(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleIssueAccount = async () => {
    if (!editing) return
    if (!issueEmail.trim() || issuePassword.length < 6) {
      setAccountError('로그인 이메일과 임시 비밀번호(최소 6자)를 입력하세요.')
      return
    }
    setSaving(true)
    setAccountError(null)
    try {
      const res = await createAdminSalesAgentAccount(editing.id, {
        email: issueEmail.trim(),
        temporaryPassword: issuePassword,
        isActive: true,
      })
      setAccount(res)
      setIssuePassword('')
      setShowIssuePassword(false)
      await load()
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : '계정 발급에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleAccountStatus = async () => {
    if (!editing || !statusConfirm) return
    setSaving(true)
    setAccountError(null)
    try {
      const res = await updateAdminSalesAgentAccountStatus(
        editing.id,
        statusConfirm === 'activate',
      )
      setAccount(res)
      setStatusConfirm(null)
      await load()
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : '계정 상태 변경에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!editing) return
    if (resetPassword.length < 6) {
      setAccountError('임시 비밀번호는 최소 6자입니다.')
      return
    }
    setSaving(true)
    setAccountError(null)
    try {
      await resetAdminSalesAgentAccountPassword(editing.id, resetPassword)
      setResetConfirmOpen(false)
      setResetPassword('')
      setShowResetPassword(false)
      await loadAccount(editing.id)
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : '비밀번호 재설정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const copyPassword = async (kind: 'issue' | 'reset', value: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      setAccountError('클립보드 복사에 실패했습니다.')
    }
  }

  const tableData = useMemo(
    () =>
      items.map((row) => {
        const accountStatus = row.accountStatus || (row.hasAccount ? 'ACTIVE' : 'NONE')
        return {
          name: (
            <div>
              <p className="font-medium text-gray-900">{row.name}</p>
              <p className="text-xs text-gray-500">{row.code}</p>
            </div>
          ),
          employment: (
            <span className="text-sm">
              {EMPLOYMENT_LABEL[row.employmentType] ?? row.employmentType}
            </span>
          ),
          org: (
            <div className="text-sm">
              <p>{row.distributorName || '본사'}</p>
              <p className="text-xs text-gray-500">{row.agencyName || '-'}</p>
            </div>
          ),
          contact: <span className="text-sm">{row.phone || row.email || '-'}</span>,
          partners: <span className="text-sm">{row.partnerCount}</span>,
          commission: (
            <span className="text-sm">{formatMoney(row.estimatedMonthlyCommission)}</span>
          ),
          status: (
            <AdminBadge
              label={STATUS_LABEL[row.status] ?? row.status}
              variant={STATUS_VARIANT[row.status] ?? 'neutral'}
            />
          ),
          account: (
            <AdminBadge
              label={ACCOUNT_STATUS_LABEL[accountStatus] ?? accountStatus}
              variant={ACCOUNT_STATUS_VARIANT[accountStatus] ?? 'neutral'}
            />
          ),
          actions: (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="text-sm text-blue-600" onClick={() => openEdit(row)}>
                수정
              </button>
              {row.status === 'ACTIVE' ? (
                <button
                  type="button"
                  className="text-sm text-amber-600"
                  onClick={() => void handleStatus(row.id, 'SUSPENDED')}
                >
                  정지
                </button>
              ) : (
                <button
                  type="button"
                  className="text-sm text-green-600"
                  onClick={() => void handleStatus(row.id, 'ACTIVE')}
                >
                  활성
                </button>
              )}
              <button
                type="button"
                className="text-sm text-red-500"
                onClick={() => setDeleteTarget(row)}
              >
                삭제
              </button>
            </div>
          ),
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="영업사원 관리"
        description="고용유형·소속별 영업사원을 관리합니다"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            + 영업사원 등록
          </button>
        }
      />

      <SalesSubNav />

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={keyword}
          onChange={(e) => {
            setPage(1)
            setKeyword(e.target.value)
          }}
          placeholder="이름·코드 검색"
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        />
        <select
          value={employmentType}
          onChange={(e) => {
            setPage(1)
            setEmploymentType(e.target.value)
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          <option value="all">전체 고용유형</option>
          <option value="DIRECT">본사 직속</option>
          <option value="DISTRIBUTOR">총판 직속</option>
          <option value="AGENCY">영업점</option>
          <option value="FREELANCER">프리랜서</option>
        </select>
        <select
          value={distributorId}
          onChange={(e) => {
            setPage(1)
            setDistributorId(e.target.value)
            setAgencyId('')
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          <option value="">전체 총판</option>
          {distributors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={agencyId}
          onChange={(e) => {
            setPage(1)
            setAgencyId(e.target.value)
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
          disabled={!distributorId}
        >
          <option value="">전체 영업점</option>
          {agencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value)
          }}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        >
          <option value="all">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">비활성</option>
          <option value="SUSPENDED">정지</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setKeyword('')
            setStatus('all')
            setEmploymentType('all')
            setDistributorId('')
            setAgencyId('')
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
            { key: 'name', label: '영업사원' },
            { key: 'employment', label: '고용유형', width: '100px' },
            { key: 'org', label: '소속' },
            { key: 'contact', label: '연락처' },
            { key: 'partners', label: '업체', width: '70px' },
            { key: 'commission', label: '예상 수수료', width: '110px' },
            { key: 'status', label: '상태', width: '90px' },
            { key: 'account', label: '포털 계정', width: '90px' },
            { key: 'actions', label: '', width: '160px' },
          ]}
          data={tableData}
          emptyMessage="등록된 영업사원이 없습니다."
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
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? '영업사원 수정' : '영업사원 등록'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving || !form.name.trim() || !form.code.trim()}
              onClick={() => void handleSave()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-gray-600">이름 *</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">코드 *</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">고용유형</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.employmentType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  employmentType: e.target.value as SalesEmploymentType,
                }))
              }
            >
              <option value="DIRECT">본사 직속</option>
              <option value="DISTRIBUTOR">총판 직속</option>
              <option value="AGENCY">영업점</option>
              <option value="FREELANCER">프리랜서</option>
            </select>
          </label>
          {!editing ? (
            <label className="space-y-1">
              <span className="text-gray-600">상태</span>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as SalesOrgStatus }))
                }
              >
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
                <option value="SUSPENDED">정지</option>
              </select>
            </label>
          ) : null}
          <label className="space-y-1">
            <span className="text-gray-600">총판</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.distributorId}
              onChange={(e) =>
                setForm((f) => ({ ...f, distributorId: e.target.value, agencyId: '' }))
              }
            >
              <option value="">없음 (본사)</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">영업점</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.agencyId}
              onChange={(e) => setForm((f) => ({ ...f, agencyId: e.target.value }))}
              disabled={!form.distributorId}
            >
              <option value="">없음</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">연락처</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">이메일</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">입사일</span>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              value={form.joinedAt}
              onChange={(e) => setForm((f) => ({ ...f, joinedAt: e.target.value }))}
            />
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

        {editing ? (
          <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">포털 계정</h3>
              {accountLoading ? (
                <span className="text-xs text-gray-400">불러오는 중...</span>
              ) : null}
            </div>
            <p className="text-xs text-gray-500">
              Sales Portal(`/sales/login`) 로그인용 계정입니다. 임시 비밀번호는 저장 후 다시 조회할
              수 없습니다.
            </p>
            {accountError ? (
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{accountError}</div>
            ) : null}

            {!accountLoading && account && !account.hasAccount ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <label className="space-y-1">
                  <span className="text-gray-600">로그인 이메일</span>
                  <input
                    type="email"
                    autoComplete="off"
                    className="w-full border rounded-lg px-3 py-2"
                    value={issueEmail}
                    onChange={(e) => setIssueEmail(e.target.value)}
                    placeholder="sales@example.com"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-gray-600">임시 비밀번호 (최소 6자)</span>
                  <div className="flex gap-2">
                    <input
                      type={showIssuePassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="w-full border rounded-lg px-3 py-2"
                      value={issuePassword}
                      onChange={(e) => setIssuePassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-2 border rounded-lg text-xs whitespace-nowrap"
                      onClick={() => setShowIssuePassword((v) => !v)}
                    >
                      {showIssuePassword ? '숨김' : '표시'}
                    </button>
                    <button
                      type="button"
                      className="px-2 border rounded-lg text-xs whitespace-nowrap"
                      onClick={() => void copyPassword('issue', issuePassword)}
                      disabled={!issuePassword}
                    >
                      {copied === 'issue' ? '복사됨' : '복사'}
                    </button>
                  </div>
                </label>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    disabled={saving || editing.status !== 'ACTIVE'}
                    onClick={() => void handleIssueAccount()}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
                  >
                    {saving ? '발급 중...' : '계정 발급'}
                  </button>
                  {editing.status !== 'ACTIVE' ? (
                    <p className="text-xs text-amber-600 mt-2">
                      활성 영업사원에게만 포털 계정을 발급할 수 있습니다.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!accountLoading && account?.hasAccount ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">이메일</p>
                    <p className="font-medium text-gray-900">{account.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">활성 상태</p>
                    <AdminBadge
                      label={account.isActive ? '활성' : '비활성'}
                      variant={account.isActive ? 'success' : 'warning'}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">생성일</p>
                    <p>{formatDateTime(account.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">최근 로그인</p>
                    <p>{formatDateTime(account.lastLoginAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {account.isActive ? (
                    <button
                      type="button"
                      className="px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg text-sm"
                      onClick={() => setStatusConfirm('deactivate')}
                    >
                      계정 비활성화
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="px-3 py-1.5 border border-green-300 text-green-700 rounded-lg text-sm"
                      onClick={() => setStatusConfirm('activate')}
                    >
                      계정 재활성화
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700">임시 비밀번호 재설정</p>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="border rounded-lg px-3 py-2 min-w-[180px] flex-1"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="새 임시 비밀번호"
                    />
                    <button
                      type="button"
                      className="px-2 border rounded-lg text-xs"
                      onClick={() => setShowResetPassword((v) => !v)}
                    >
                      {showResetPassword ? '숨김' : '표시'}
                    </button>
                    <button
                      type="button"
                      className="px-2 border rounded-lg text-xs"
                      onClick={() => void copyPassword('reset', resetPassword)}
                      disabled={!resetPassword}
                    >
                      {copied === 'reset' ? '복사됨' : '복사'}
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm disabled:opacity-40"
                      disabled={saving || resetPassword.length < 6}
                      onClick={() => setResetConfirmOpen(true)}
                    >
                      재설정
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="영업사원 삭제"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setDeleteTarget(null)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm disabled:opacity-40"
              onClick={() => void handleDelete()}
            >
              {saving ? '삭제 중...' : '삭제'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          <strong>{deleteTarget?.name}</strong> 영업사원을 삭제할까요? 활성 배정이 있으면 삭제할
          수 없습니다. 연결된 포털 계정이 있으면 로그인만 비활성화됩니다.
        </p>
      </AdminModal>

      <AdminModal
        open={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        title={statusConfirm === 'deactivate' ? '계정 비활성화' : '계정 재활성화'}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setStatusConfirm(null)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              className={`px-3 py-1.5 text-white rounded-lg text-sm disabled:opacity-40 ${
                statusConfirm === 'deactivate' ? 'bg-amber-600' : 'bg-green-600'
              }`}
              onClick={() => void handleAccountStatus()}
            >
              {saving ? '처리 중...' : '확인'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          {statusConfirm === 'deactivate'
            ? '포털 로그인을 비활성화할까요? 영업사원 정보와 담당 업체 배정은 유지됩니다.'
            : '포털 로그인을 다시 활성화할까요?'}
        </p>
      </AdminModal>

      <AdminModal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="임시 비밀번호 재설정"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-lg text-sm"
              onClick={() => setResetConfirmOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm disabled:opacity-40"
              onClick={() => void handleResetPassword()}
            >
              {saving ? '재설정 중...' : '재설정'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          임시 비밀번호를 재설정할까요? 기존 비밀번호로는 즉시 로그인할 수 없으며, 새 비밀번호는
          이후 다시 조회할 수 없습니다.
        </p>
      </AdminModal>
    </div>
  )
}
