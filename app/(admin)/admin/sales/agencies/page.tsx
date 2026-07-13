'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import SalesSubNav from '@/components/admin/SalesSubNav'
import {
  createAdminSalesAgency,
  createAdminSalesAgencyAccount,
  deleteAdminSalesAgency,
  fetchAdminSalesAgencies,
  fetchAdminSalesAgencyAccount,
  fetchAdminSalesDistributors,
  resetAdminSalesAgencyAccountPassword,
  updateAdminSalesAgency,
  updateAdminSalesAgencyAccountStatus,
  updateAdminSalesAgencyStatus,
  type AdminSalesAgency,
  type AdminSalesAgencyAccount,
  type AdminSalesDistributor,
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

const PAGE_SIZE = 20

const EMPTY_FORM = {
  distributorId: '',
  name: '',
  code: '',
  representativeName: '',
  phone: '',
  email: '',
  region: '',
  status: 'ACTIVE' as SalesOrgStatus,
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

export default function AdminSalesAgenciesPage() {
  const [items, setItems] = useState<AdminSalesAgency[]>([])
  const [distributors, setDistributors] = useState<AdminSalesDistributor[]>([])
  const [distributorId, setDistributorId] = useState('')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminSalesAgency | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<AdminSalesAgency | null>(null)

  const [account, setAccount] = useState<AdminSalesAgencyAccount | null>(null)
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
      const list = await fetchAdminSalesAgencies({
        keyword: keyword || undefined,
        status,
        distributorId: distributorId || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(list.items)
      setTotal(list.total)
      setTotalPages(list.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '영업점을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [keyword, status, distributorId, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void fetchAdminSalesDistributors({ pageSize: 100 })
      .then((res) => setDistributors(res.items))
      .catch(() => setDistributors([]))
  }, [])

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

  const loadAccount = async (id: string) => {
    setAccountLoading(true)
    setAccountError(null)
    try {
      const res = await fetchAdminSalesAgencyAccount(id)
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
    setForm({ ...EMPTY_FORM, distributorId: distributorId || '' })
    setFormOpen(true)
  }

  const openEdit = (row: AdminSalesAgency) => {
    setEditing(row)
    resetAccountForm()
    setForm({
      distributorId: row.distributorId,
      name: row.name,
      code: row.code,
      representativeName: row.representativeName || '',
      phone: row.phone || '',
      email: row.email || '',
      region: row.region || '',
      status: (row.status as SalesOrgStatus) || 'ACTIVE',
      memo: row.memo || '',
    })
    setIssueEmail(row.accountEmail || row.email || '')
    setFormOpen(true)
    void loadAccount(row.id)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.distributorId) return
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await updateAdminSalesAgency(editing.id, {
          distributorId: Number(form.distributorId),
          name: form.name.trim(),
          code: form.code.trim(),
          representativeName: form.representativeName || null,
          phone: form.phone || null,
          email: form.email || null,
          region: form.region || null,
          memo: form.memo || null,
        })
      } else {
        await createAdminSalesAgency({
          distributorId: Number(form.distributorId),
          name: form.name.trim(),
          code: form.code.trim(),
          representativeName: form.representativeName || null,
          phone: form.phone || null,
          email: form.email || null,
          region: form.region || null,
          status: form.status,
          memo: form.memo || null,
        })
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
      await updateAdminSalesAgencyStatus(id, next)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteAdminSalesAgency(deleteTarget.id)
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
      const res = await createAdminSalesAgencyAccount(editing.id, {
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
      const res = await updateAdminSalesAgencyAccountStatus(
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
      await resetAdminSalesAgencyAccountPassword(editing.id, resetPassword)
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
          distributor: <span className="text-sm">{row.distributorName || '-'}</span>,
          contact: (
            <div className="text-sm">
              <p>{row.representativeName || '-'}</p>
              <p className="text-xs text-gray-500">{row.phone || row.email || '-'}</p>
            </div>
          ),
          region: <span className="text-sm">{row.region || '-'}</span>,
          counts: (
            <span className="text-sm">
              사원 {row.agentCount} · 업체 {row.partnerCount}
            </span>
          ),
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
        title="영업점 관리"
        description="총판 소속 영업점을 관리합니다"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            + 영업점 등록
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
          placeholder="영업점명·코드 검색"
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
        />
        <select
          value={distributorId}
          onChange={(e) => {
            setPage(1)
            setDistributorId(e.target.value)
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
            setDistributorId('')
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
            { key: 'name', label: '영업점' },
            { key: 'distributor', label: '총판' },
            { key: 'contact', label: '연락처' },
            { key: 'region', label: '지역', width: '90px' },
            { key: 'counts', label: '구성' },
            { key: 'commission', label: '예상 수수료', width: '110px' },
            { key: 'status', label: '상태', width: '90px' },
            { key: 'account', label: '포털 계정', width: '90px' },
            { key: 'actions', label: '', width: '160px' },
          ]}
          data={tableData}
          emptyMessage="등록된 영업점이 없습니다."
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
        title={editing ? '영업점 수정' : '영업점 등록'}
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
              disabled={saving || !form.name.trim() || !form.code.trim() || !form.distributorId}
              onClick={() => void handleSave()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <label className="space-y-1 md:col-span-2">
            <span className="text-gray-600">총판 *</span>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.distributorId}
              onChange={(e) => setForm((f) => ({ ...f, distributorId: e.target.value }))}
            >
              <option value="">선택</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">영업점명 *</span>
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
            <span className="text-gray-600">대표자</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.representativeName}
              onChange={(e) => setForm((f) => ({ ...f, representativeName: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-gray-600">지역</span>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            />
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
              Agency Portal(`/agency/login`) 로그인용 계정입니다. 임시 비밀번호는 저장 후
              다시 조회할 수 없습니다.
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
                    placeholder="agency@example.com"
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
                      활성 영업점에게만 포털 계정을 발급할 수 있습니다.
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
        title="영업점 삭제"
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
          <strong>{deleteTarget?.name}</strong> 영업점을 삭제할까요? 하위 영업사원이 있으면
          삭제할 수 없습니다. 연결된 포털 계정이 있으면 로그인만 비활성화됩니다.
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
            ? '포털 로그인을 비활성화할까요? 영업점 정보와 소속 영업사원은 유지됩니다.'
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
          임시 비밀번호를 재설정할까요? 재설정 후 다시 조회할 수 없습니다.
        </p>
      </AdminModal>
    </div>
  )
}
