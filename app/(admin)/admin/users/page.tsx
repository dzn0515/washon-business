'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import {
  fetchAdminAppUsers,
  type AdminAppUserListItem,
  type AdminAppUserSummary,
} from '@/lib/admin-api'

const PAGE_SIZE = 20

const PROVIDER_LABEL: Record<string, string> = {
  EMAIL: '이메일',
  KAKAO: '카카오',
  NAVER: '네이버',
  GOOGLE: '구글',
  APPLE: 'Apple',
  PHONE: '전화',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '정상',
  SUSPENDED: '정지',
  WITHDRAWN: '탈퇴',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error' | 'info'> = {
  ACTIVE: 'success',
  SUSPENDED: 'error',
  WITHDRAWN: 'neutral',
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('ko-KR')
}

function consentLabel(v: boolean | null | undefined) {
  if (v === true) return '동의'
  if (v === false) return '미동의'
  return '미수집'
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminAppUserListItem[]>([])
  const [summary, setSummary] = useState<AdminAppUserSummary | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [status, setStatus] = useState('all')
  const [joinedFrom, setJoinedFrom] = useState('')
  const [joinedTo, setJoinedTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminAppUsers({
        keyword: keyword || undefined,
        status: status === 'all' ? undefined : status,
        joinedFrom: joinedFrom || undefined,
        joinedTo: joinedTo || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(data.items)
      setSummary(data.summary)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '회원 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [keyword, status, joinedFrom, joinedTo, page])

  useEffect(() => {
    void load()
  }, [load])

  const handleSearch = () => {
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  const handleReset = () => {
    setKeywordInput('')
    setKeyword('')
    setStatus('all')
    setJoinedFrom('')
    setJoinedTo('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="고객관리"
        description="AUTOON 앱에 가입한 소비자 회원을 조회하고 관리합니다."
        actions={
          <button
            type="button"
            onClick={() => void load()}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
          >
            새로고침
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard label="총 회원" value={summary?.totalMembers ?? '-'} color="blue" />
        <AdminStatCard label="오늘 가입" value={summary?.joinedToday ?? '-'} color="green" />
        <AdminStatCard label="이번 달 가입" value={summary?.joinedThisMonth ?? '-'} color="purple" />
        <AdminStatCard label="정지 회원" value={summary?.suspendedCount ?? '-'} color="red" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch()
            }}
            placeholder="이름 / 전화번호 / 이메일"
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 min-w-[200px] flex-1"
          />
          <select
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <option value="all">전체 상태</option>
            <option value="ACTIVE">정상</option>
            <option value="SUSPENDED">정지</option>
          </select>
          <input
            type="date"
            value={joinedFrom}
            onChange={(e) => {
              setPage(1)
              setJoinedFrom(e.target.value)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          />
          <input
            type="date"
            value={joinedTo}
            onChange={(e) => {
              setPage(1)
              setJoinedTo(e.target.value)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white"
          >
            검색
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
          >
            초기화
          </button>
        </div>
        <p className="text-xs text-gray-500">총 {total}명</p>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <AdminTable
          loading={loading}
          columns={[
            { key: 'member', label: '회원' },
            { key: 'provider', label: '가입 방식', width: '90px' },
            { key: 'joined', label: '가입일', width: '110px' },
            { key: 'reservations', label: '예약', width: '70px' },
            { key: 'partners', label: '업체', width: '70px' },
            { key: 'lastRes', label: '최근 예약', width: '110px' },
            { key: 'consent', label: '수신 동의', width: '120px' },
            { key: 'status', label: '상태', width: '80px' },
            { key: 'actions', label: '', width: '70px' },
          ]}
          data={items.map((row) => ({
            member: (
              <div>
                <Link
                  href={`/admin/users/${row.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {row.name}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">
                  {row.phone || row.email || '-'}
                </p>
              </div>
            ),
            provider: PROVIDER_LABEL[row.loginProvider] ?? row.loginProvider,
            joined: formatDate(row.joinedAt),
            reservations: row.reservationCount,
            partners: row.visitedPartnerCount,
            lastRes: row.lastReservationAt ? formatDate(row.lastReservationAt) : '이용 전',
            consent: (
              <span className="text-xs text-gray-600">
                푸시 {consentLabel(row.pushConsent)}
                <br />
                마케팅 {consentLabel(row.marketingConsent)}
              </span>
            ),
            status: (
              <AdminBadge
                label={STATUS_LABEL[row.status] ?? row.status}
                variant={STATUS_VARIANT[row.status] ?? 'neutral'}
              />
            ),
            actions: (
              <button
                type="button"
                className="text-xs text-blue-600 underline"
                onClick={() => router.push(`/admin/users/${row.id}`)}
              >
                상세
              </button>
            ),
          }))}
        />
      </div>

      {totalPages > 1 ? (
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-sm px-3 py-1 border rounded-lg disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-gray-600 py-1">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="text-sm px-3 py-1 border rounded-lg disabled:opacity-40"
          >
            다음
          </button>
        </div>
      ) : null}
    </div>
  )
}
