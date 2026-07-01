'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import {
  fetchAdminNotices,
  sendAdminNotice,
  type AdminNotice,
  type NoticePayload,
} from '@/lib/admin-api'

const TARGET_LABEL: Record<string, string> = {
  all: '전체',
  business: '업체',
  customer: '고객',
}

const CHANNEL_LABEL: Record<string, string> = {
  push: '📱 앱 푸시',
  email: '📧 이메일',
  sms: '💬 SMS',
}

const SEND_TYPE_LABEL: Record<string, string> = {
  immediate: '즉시',
  scheduled: '예약',
}

const STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  sent: 'success',
  scheduled: 'info',
  draft: 'neutral',
  failed: 'error',
}

const STATUS_LABEL: Record<string, string> = {
  sent: '발송완료',
  scheduled: '예약발송',
  draft: '임시저장',
  failed: '실패',
}

const EMPTY_FORM: NoticePayload = {
  title: '',
  content: '',
  target: 'all',
  channels: [],
  sendType: 'immediate',
  scheduledAt: '',
}

export default function AdminNoticesPage() {
  const { showToast, ToastComponent } = useToast()
  const [notices, setNotices] = useState<AdminNotice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [writeOpen, setWriteOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [form, setForm] = useState<NoticePayload>(EMPTY_FORM)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdminNotices()
      setNotices(data)
    } catch {
      setError(true)
      setNotices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const canSubmit =
    form.title.trim().length > 0 &&
    form.content.trim().length > 0 &&
    form.channels.length > 0 &&
    (form.sendType === 'immediate' || !!form.scheduledAt)

  const toggleChannel = (ch: 'push' | 'email' | 'sms') => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter((c) => c !== ch)
        : [...prev.channels, ch],
    }))
  }

  const handleSend = async () => {
    setSending(true)
    try {
      const payload: NoticePayload = {
        ...form,
        scheduledAt: form.sendType === 'scheduled' ? form.scheduledAt : undefined,
      }
      await sendAdminNotice(payload)
      showToast('공지가 발송되었습니다.', 'success')
      setConfirmOpen(false)
      setWriteOpen(false)
      setForm(EMPTY_FORM)
      load()
    } catch {
      showToast('발송에 실패했습니다.', 'error')
    } finally {
      setSending(false)
    }
  }

  const confirmMessage = `${TARGET_LABEL[form.target]}에게 ${form.channels.map((c) => CHANNEL_LABEL[c]).join(', ')} 알림을 발송합니다. 계속하시겠습니까?`

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="공지 / 알림"
        description="플랫폼 공지 및 푸시·이메일·SMS 발송"
        actions={
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM)
              setWriteOpen(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            공지 작성
          </button>
        }
      />

      {error ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">공지 목록을 불러오지 못했습니다.</p>
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
              { key: 'title', label: '제목' },
              { key: 'target', label: '대상' },
              { key: 'channels', label: '채널' },
              { key: 'sendType', label: '발송 유형' },
              { key: 'status', label: '상태' },
              { key: 'scheduledAt', label: '예약일시' },
              { key: 'createdAt', label: '작성일' },
            ]}
            data={notices.map((n) => ({
              title: n.title,
              target: TARGET_LABEL[n.target] ?? n.target,
              channels: (
                <div className="flex flex-wrap gap-1">
                  {n.channels.map((c) => (
                    <span key={c} className="text-xs text-gray-600">
                      {CHANNEL_LABEL[c] ?? c}
                    </span>
                  ))}
                </div>
              ),
              sendType: SEND_TYPE_LABEL[n.sendType] ?? n.sendType,
              scheduledAt: n.scheduledAt?.slice(0, 16).replace('T', ' ') ?? '-',
              createdAt: n.createdAt,
              status: (
                <AdminBadge
                  label={STATUS_LABEL[n.status] ?? n.status}
                  variant={STATUS_VARIANT[n.status] ?? 'neutral'}
                />
              ),
            }))}
            emptyMessage="공지가 없습니다."
          />
        </div>
      )}

      {/* 작성 모달 */}
      <AdminModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        title="공지 작성"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setWriteOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!canSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              발송
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs text-gray-500 mb-1">제목 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">내용 *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">발송 대상</label>
            <select
              value={form.target}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  target: e.target.value as NoticePayload['target'],
                }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="all">전체</option>
              <option value="business">업체만</option>
              <option value="customer">고객만</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">발송 채널 *</label>
            <div className="flex flex-wrap gap-4">
              {(['push', 'email', 'sms'] as const).map((ch) => (
                <label key={ch} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.channels.includes(ch)}
                    onChange={() => toggleChannel(ch)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  {CHANNEL_LABEL[ch]}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">발송 시간</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.sendType === 'immediate'}
                  onChange={() => setForm((p) => ({ ...p, sendType: 'immediate' }))}
                />
                즉시 발송
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.sendType === 'scheduled'}
                  onChange={() => setForm((p) => ({ ...p, sendType: 'scheduled' }))}
                />
                예약 발송
              </label>
              {form.sendType === 'scheduled' && (
                <input
                  type="datetime-local"
                  value={form.scheduledAt ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2"
                />
              )}
              <label className="flex items-center gap-2 text-gray-400">
                <input type="radio" disabled />
                반복 발송 (추후 지원 예정)
              </label>
            </div>
          </div>
        </div>
      </AdminModal>

      {/* 발송 확인 모달 */}
      <AdminModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="발송 확인"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? '발송 중...' : '확인'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">{confirmMessage}</p>
      </AdminModal>
    </div>
  )
}
