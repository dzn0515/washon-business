'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { mockNotificationHistory } from '@/lib/mock/admin-data'

const TARGETS = ['전체 업체', '승인 대기', '특정 업체']
const CHANNELS = [
  { id: 'app', label: '앱 알림' },
  { id: 'alimtalk', label: '알림톡' },
  { id: 'email', label: '이메일' },
] as const

export default function AdminNotificationsPage() {
  const [target, setTarget] = useState(TARGETS[0])
  const [channels, setChannels] = useState<Record<string, boolean>>({
    app: true,
    alimtalk: false,
    email: false,
  })
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [history, setHistory] = useState(mockNotificationHistory)

  const toggleChannel = (id: string) => {
    setChannels((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSend = () => {
    if (!title.trim() || !body.trim()) return
    const channelLabels = CHANNELS.filter((c) => channels[c.id])
      .map((c) => c.label)
      .join(', ')
    setHistory([
      {
        sentAt: new Date().toLocaleString('ko-KR'),
        target,
        channel: channelLabels || '앱 알림',
        title: title.trim(),
        received: target === '승인 대기' ? 3 : 284,
        read: 0,
      },
      ...history,
    ])
    setSent(true)
    setTitle('')
    setBody('')
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="space-y-6">
      <Card title="알림 발송">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">받는 대상</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
            >
              {TARGETS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-2">채널</label>
            <div className="flex flex-wrap gap-3">
              {CHANNELS.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels[c.id]}
                    onChange={() => toggleChannel(c.id)}
                    className="rounded border-gray-300"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">제목</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="알림 제목" />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">내용</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="알림 내용을 입력하세요"
              rows={5}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" type="button">
              미리보기
            </Button>
            <Button className="flex-1 bg-[#1A6DFF]" onClick={handleSend} disabled={!title.trim() || !body.trim()}>
              발송하기
            </Button>
          </div>

          {sent && (
            <p className="text-sm text-green-600 text-center bg-green-50 rounded-lg py-2">
              발송이 완료됐습니다. (mock)
            </p>
          )}
        </div>
      </Card>

      <Card title="발송 이력">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-medium">발송일</th>
                <th className="pb-2 font-medium">대상</th>
                <th className="pb-2 font-medium">채널</th>
                <th className="pb-2 font-medium">제목</th>
                <th className="pb-2 font-medium">수신</th>
                <th className="pb-2 font-medium">열람</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 text-gray-500 whitespace-nowrap">{row.sentAt}</td>
                  <td className="py-3 text-gray-600">{row.target}</td>
                  <td className="py-3 text-gray-600">{row.channel}</td>
                  <td className="py-3 font-medium text-gray-900">{row.title}</td>
                  <td className="py-3 text-gray-600">{row.received}</td>
                  <td className="py-3 text-gray-600">{row.read}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
