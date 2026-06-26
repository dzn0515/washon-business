'use client'

import { useState } from 'react'
import { MapPin, Check, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { mockPendingBusinesses, type MockBusiness } from '@/lib/mock/admin-data'

type Tab = 'pending' | 'active' | 'rejected'

export default function AdminPendingBusinessesPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const [items, setItems] = useState<MockBusiness[]>(mockPendingBusinesses)
  const [approved, setApproved] = useState<MockBusiness[]>([])
  const [rejected, setRejected] = useState<MockBusiness[]>([])

  const [approveTarget, setApproveTarget] = useState<MockBusiness | null>(null)
  const [rejectTarget, setRejectTarget] = useState<MockBusiness | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending', label: '대기 중', count: items.length },
    { key: 'active', label: '승인됨', count: approved.length + 281 },
    { key: 'rejected', label: '거절됨', count: rejected.length + 12 },
  ]

  const list =
    tab === 'pending' ? items : tab === 'active' ? approved : rejected

  const handleApprove = () => {
    if (!approveTarget) return
    setItems((prev) => prev.filter((b) => b.id !== approveTarget.id))
    setApproved((prev) => [
      ...prev,
      { ...approveTarget, status: 'active', approvedAt: new Date().toISOString().slice(0, 10) },
    ])
    setApproveTarget(null)
  }

  const handleReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setItems((prev) => prev.filter((b) => b.id !== rejectTarget.id))
    setRejected((prev) => [...prev, { ...rejectTarget, status: 'rejected' }])
    setRejectTarget(null)
    setRejectReason('')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border ${
              tab === t.key ? 'bg-[#1A6DFF] text-white border-[#1A6DFF]' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {t.label} {t.count}
          </button>
        ))}
      </div>

      {tab === 'pending' && items.length > 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          ⚠️ 승인 대기 {items.length}건 — 빠른 처리가 필요합니다
        </p>
      )}

      {list.length === 0 && tab !== 'pending' && tab === 'active' && approved.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          이번 세션에서 승인한 업체가 없습니다. (전체 승인 281건)
        </p>
      ) : list.length === 0 && tab === 'rejected' && rejected.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          이번 세션에서 거절한 업체가 없습니다. (전체 거절 12건)
        </p>
      ) : list.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">승인 대기 업체가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              {tab === 'pending' ? (
                <PendingCard
                  business={b}
                  onApprove={() => setApproveTarget(b)}
                  onReject={() => setRejectTarget(b)}
                />
              ) : (
                <ApprovedCard business={b} tab={tab} />
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!approveTarget} onClose={() => setApproveTarget(null)} title="업체 승인" size="sm">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm font-medium text-gray-900">업체를 승인하시겠습니까?</p>
            {approveTarget && (
              <p className="text-sm text-gray-600 mt-1">
                {approveTarget.name} ({approveTarget.ownerName})
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">승인 시 사장님에게 알림톡이 발송됩니다.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setApproveTarget(null)}>
              취소
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprove}>
              승인하기
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="업체 거절" size="sm">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl mb-2">❌</div>
            <p className="text-sm font-medium text-gray-900">거절 사유를 입력해주세요</p>
          </div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="사유 입력"
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
          />
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setRejectTarget(null)}>
              취소
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={!rejectReason.trim()}
              onClick={handleReject}
            >
              거절하기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function PendingCard({
  business: b,
  onApprove,
  onReject,
}: {
  business: MockBusiness
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <>
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-semibold text-gray-900">{b.name}</h3>
        <span className="text-xs text-gray-400 shrink-0">{b.appliedAt.replace(/-/g, '.')}</span>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {b.ownerName} · {b.email}
      </p>
      <p className="text-sm text-gray-500">
        {b.phone} · 사업자번호: {b.businessNumber}
      </p>
      <p className="text-sm text-gray-500 mt-1 flex items-start gap-1">
        <MapPin size={14} className="shrink-0 mt-0.5" />
        {b.address}
      </p>
      <p className="text-xs text-gray-400 mt-2">
        업종: {b.type} · 베이: {b.bays}개
      </p>
      <div className="flex gap-2 mt-4">
        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={onApprove}>
          <Check size={14} className="mr-1" /> 승인
        </Button>
        <Button size="sm" variant="danger" className="flex-1" onClick={onReject}>
          <X size={14} className="mr-1" /> 거절
        </Button>
      </div>
    </>
  )
}

function ApprovedCard({ business: b, tab }: { business: MockBusiness; tab: Tab }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-gray-900">{b.name}</h3>
        <Badge className={tab === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}>
          {tab === 'active' ? '승인됨' : '거절됨'}
        </Badge>
        <span className="text-xs text-gray-400">{b.approvedAt ?? b.appliedAt}</span>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        {b.ownerName}
        {tab === 'active' && ' · 앱 노출 유지비 정상'}
      </p>
      {tab === 'active' && (
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" variant="secondary">
            상세보기
          </Button>
          <Button size="sm" variant="secondary">
            노출 중지
          </Button>
          <Button size="sm" variant="danger">
            탈퇴 처리
          </Button>
        </div>
      )}
    </>
  )
}
