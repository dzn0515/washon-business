'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Card from '@/components/ui/Card'
import {
  mockAllBusinesses,
  mockApprovedBusinesses,
  mockPendingBusinesses,
  mockRejectedBusinesses,
  REGIONS,
  STATUS_LABEL,
  type MockBusiness,
  type BusinessStatus,
} from '@/lib/mock/admin-data'

const STATUS_FILTERS: { key: string; label: string; statuses?: BusinessStatus[] }[] = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '운영중', statuses: ['active'] },
  { key: 'pending', label: '승인대기', statuses: ['pending'] },
  { key: 'suspended', label: '정지', statuses: ['suspended', 'inactive', 'rejected'] },
]

export default function AdminBusinessesPage() {
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('전체')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detail, setDetail] = useState<MockBusiness | null>(null)

  const filtered = useMemo(() => {
    const sf = STATUS_FILTERS.find((f) => f.key === statusFilter)
    return mockAllBusinesses.filter((b) => {
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.ownerName.toLowerCase().includes(q) ||
        b.businessNumber.includes(q) ||
        b.email.toLowerCase().includes(q)
      const matchRegion = region === '전체' || b.region === region
      const matchStatus = !sf?.statuses || sf.statuses.includes(b.status)
      return matchSearch && matchRegion && matchStatus
    })
  }, [search, region, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            className="pl-9"
            placeholder="업체명, 사장님명, 사업자번호 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r === '전체' ? '지역 전체' : r}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${
              statusFilter === f.key
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-medium">업체명</th>
                <th className="pb-2 font-medium">대표자</th>
                <th className="pb-2 font-medium">연락처</th>
                <th className="pb-2 font-medium">지역</th>
                <th className="pb-2 font-medium">상태</th>
                <th className="pb-2 font-medium">가입일</th>
                <th className="pb-2 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-medium text-gray-900">{b.name}</td>
                  <td className="py-3 text-gray-600">{b.ownerName}</td>
                  <td className="py-3 text-gray-500">{b.phone}</td>
                  <td className="py-3 text-gray-500">{b.region}</td>
                  <td className="py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="py-3 text-gray-500">{b.appliedAt}</td>
                  <td className="py-3">
                    <Button size="sm" variant="secondary" onClick={() => setDetail(b)}>
                      상세보기
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">검색 결과가 없습니다.</p>
          )}
        </div>
      </Card>

      <div className="grid sm:grid-cols-3 gap-3 text-center text-xs text-gray-400">
        <span>대기 중 {mockPendingBusinesses.length}건</span>
        <span>승인됨 {mockApprovedBusinesses.length}건 (샘플)</span>
        <span>거절됨 {mockRejectedBusinesses.length}건 (샘플)</span>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="업체 상세" size="md">
        {detail && (
          <div className="space-y-3 text-sm">
            <Row label="업체명" value={detail.name} />
            <Row label="대표자" value={detail.ownerName} />
            <Row label="이메일" value={detail.email} />
            <Row label="전화" value={detail.phone} />
            <Row label="사업자번호" value={detail.businessNumber} />
            <Row label="주소" value={detail.address} />
            <Row label="업종" value={`${detail.type} · 베이 ${detail.bays}개`} />
            <Row label="상태" value={STATUS_LABEL[detail.status]} />
          </div>
        )}
      </Modal>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: BusinessStatus }) {
  const map: Record<BusinessStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-100 text-red-700',
    rejected: 'bg-red-50 text-red-600',
  }
  return <Badge className={map[status]}>{STATUS_LABEL[status]}</Badge>
}
