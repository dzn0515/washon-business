'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import {
  approveBusiness,
  fetchAdminBusinesses,
  rejectBusiness,
  type AdminBusiness,
} from '@/lib/api-client'

const TABS = [
  { key: 'pending', label: '대기 중' },
  { key: 'active', label: '승인됨' },
  { key: 'rejected', label: '거절됨' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function AdminPage() {
  const [tab, setTab] = useState<TabKey>('pending')
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [approveTarget, setApproveTarget] = useState<AdminBusiness | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminBusiness | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchAdminBusinesses(tab)
      setBusinesses(list)
    } catch {
      setError('관리자 권한이 필요하거나 목록을 불러오지 못했습니다.')
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  const handleApprove = async () => {
    if (!approveTarget) return
    setActionLoading(true)
    try {
      await approveBusiness(approveTarget.id)
      setApproveTarget(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '승인에 실패했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      await rejectBusiness(rejectTarget.id, rejectReason.trim())
      setRejectTarget(null)
      setRejectReason('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '거절에 실패했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  const pendingCount = tab === 'pending' ? businesses.length : undefined

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">업체 승인 관리</h1>
        <p className="text-sm text-gray-500">가입 신청 업체를 검토하고 승인/거절합니다.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border ${
              tab === t.key ? 'bg-[#1A6DFF] text-white border-[#1A6DFF]' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {t.label}
            {t.key === 'pending' && pendingCount !== undefined ? ` ${pendingCount}` : ''}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">불러오는 중...</p>
      ) : businesses.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">해당 상태의 업체가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {businesses.map((b) => (
            <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900">{b.business_name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {b.owner_name} · {b.email ?? '-'} · {b.phone ?? '-'}
              </p>
              <p className="text-sm text-gray-500 mt-1">사업자번호: {b.business_number ?? '-'}</p>
              <p className="text-sm text-gray-500">주소: {b.address}</p>
              <p className="text-xs text-gray-400 mt-2">
                신청일: {new Date(b.created_at).toLocaleDateString('ko-KR')}
              </p>
              {b.rejection_reason && (
                <p className="text-sm text-red-600 mt-2">거절 사유: {b.rejection_reason}</p>
              )}

              {tab === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => setApproveTarget(b)}
                  >
                    <Check size={14} className="mr-1" /> 승인
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-red-600 border-red-200"
                    onClick={() => setRejectTarget(b)}
                  >
                    <X size={14} className="mr-1" /> 거절
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!approveTarget} onClose={() => setApproveTarget(null)} title="업체 승인" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          <strong>{approveTarget?.business_name}</strong> 업체를 승인하시겠습니까?
        </p>
        <Button className="w-full" onClick={handleApprove} disabled={actionLoading}>
          {actionLoading ? '처리 중...' : '승인하기'}
        </Button>
      </Modal>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="업체 거절" size="sm">
        <p className="text-sm text-gray-600 mb-3">
          <strong>{rejectTarget?.business_name}</strong> 업체 가입을 거절합니다.
        </p>
        <Input
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="거절 사유를 입력하세요"
        />
        <Button
          className="w-full mt-4 bg-red-600 hover:bg-red-700"
          onClick={handleReject}
          disabled={actionLoading || !rejectReason.trim()}
        >
          {actionLoading ? '처리 중...' : '거절하기'}
        </Button>
      </Modal>
    </div>
  )
}
