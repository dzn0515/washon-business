'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import {
  fetchAdminCSInquiries,
  replyAdminCSInquiry,
  type AdminCSInquiry,
} from '@/lib/admin-api'

const TYPE_TABS = [
  { key: 'all', label: '전체' },
  { key: 'customer', label: '1:1 문의' },
  { key: 'business', label: '업체 문의' },
  { key: 'report', label: '신고' },
  { key: 'dispute', label: '분쟁' },
  { key: 'refund', label: '환불' },
] as const

const STATUS_TABS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '접수' },
  { key: 'in_progress', label: '처리중' },
  { key: 'completed', label: '완료' },
  { key: 'hold', label: '보류' },
] as const

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  customer: { label: '고객 문의', className: 'bg-blue-50 text-blue-700' },
  business: { label: '업체 문의', className: 'bg-purple-50 text-purple-700' },
  report: { label: '신고', className: 'bg-orange-50 text-orange-700' },
  dispute: { label: '분쟁', className: 'bg-red-50 text-red-700' },
  refund: { label: '환불', className: 'bg-yellow-50 text-yellow-700' },
}

const STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  hold: 'neutral',
}

const STATUS_LABEL: Record<string, string> = {
  pending: '접수',
  in_progress: '처리중',
  completed: '완료',
  hold: '보류',
}

export default function AdminCSPage() {
  const { showToast, ToastComponent } = useToast()
  const [typeTab, setTypeTab] = useState('all')
  const [statusTab, setStatusTab] = useState('all')
  const [inquiries, setInquiries] = useState<AdminCSInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [detail, setDetail] = useState<AdminCSInquiry | null>(null)
  const [reply, setReply] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdminCSInquiries({ type: typeTab, status: statusTab })
      setInquiries(data)
    } catch {
      setError(true)
      setInquiries([])
    } finally {
      setLoading(false)
    }
  }, [typeTab, statusTab])

  useEffect(() => {
    load()
  }, [load])

  const handleReply = async () => {
    if (!detail || !reply.trim()) return
    setReplyLoading(true)
    try {
      await replyAdminCSInquiry(detail.id, reply)
      showToast('답변이 등록되었습니다.', 'success')
      setDetail(null)
      setReply('')
      load()
    } catch {
      showToast('답변 등록에 실패했습니다.', 'error')
    } finally {
      setReplyLoading(false)
    }
  }

  const formatDate = (iso: string) => iso.slice(0, 16).replace('T', ' ')

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader title="고객센터" description="고객·업체 문의 및 신고 처리" />

      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTypeTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              typeTab === tab.key
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              statusTab === tab.key
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">문의 목록을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={load}
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
              { key: 'id', label: '접수번호' },
              { key: 'type', label: '유형' },
              { key: 'title', label: '제목' },
              { key: 'reporter', label: '접수자' },
              { key: 'assignee', label: '담당자' },
              { key: 'status', label: '상태' },
              { key: 'createdAt', label: '접수일' },
              { key: 'actions', label: '액션', width: '100px' },
            ]}
            data={inquiries.map((item) => {
              const typeMeta = TYPE_BADGE[item.type] ?? {
                label: item.type,
                className: 'bg-gray-100 text-gray-600',
              }
              return {
                id: item.id,
                title: item.title,
                reporter: item.customerName ?? item.businessName ?? '-',
                assignee: item.assignee ?? '-',
                createdAt: formatDate(item.createdAt),
                type: (
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeMeta.className}`}
                  >
                    {typeMeta.label}
                  </span>
                ),
                status: (
                  <AdminBadge
                    label={STATUS_LABEL[item.status] ?? item.status}
                    variant={STATUS_VARIANT[item.status] ?? 'neutral'}
                  />
                ),
                actions: (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDetail(item)
                      setReply('')
                    }}
                    className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                  >
                    상세/답변
                  </button>
                ),
              }
            })}
            emptyMessage="문의가 없습니다."
          />
        </div>
      )}

      <AdminModal
        open={!!detail}
        onClose={() => {
          setDetail(null)
          setReply('')
        }}
        title="문의 상세"
        size="lg"
        footer={
          detail?.status !== 'completed' ? (
            <div className="space-y-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="답변 내용을 입력하세요"
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={replyLoading || !reply.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {replyLoading ? '등록 중...' : '답변 등록'}
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="유형" value={TYPE_BADGE[detail.type]?.label ?? detail.type} />
              <Info label="접수일" value={formatDate(detail.createdAt)} />
              <Info
                label="접수자"
                value={detail.customerName ?? detail.businessName ?? '-'}
              />
              <Info label="담당자" value={detail.assignee ?? '미배정'} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">제목</p>
              <p className="font-medium text-gray-900">{detail.title}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">문의 내용</p>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                {detail.content ?? '(내용 없음)'}
              </p>
            </div>
            {detail.replies && detail.replies.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">답변 이력</p>
                <div className="space-y-2">
                  {detail.replies.map((r, i) => (
                    <div key={i} className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 mb-1">
                        {r.author ?? '운영자'} · {formatDate(r.createdAt)}
                      </p>
                      <p className="text-gray-700">{r.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  )
}
