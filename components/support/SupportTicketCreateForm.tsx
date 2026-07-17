'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupportTicket, fetchSupportCategories } from '@/lib/support-api'

export default function SupportTicketCreateForm({
  ticketsBasePath,
}: {
  ticketsBasePath: string
}) {
  const router = useRouter()
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [categoryId, setCategoryId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSupportCategories()
      .then((cats) => {
        setCategories(cats)
        if (cats[0]) setCategoryId(cats[0].id)
      })
      .catch((e) => setError(e instanceof Error ? e.message : '카테고리 로드 실패'))
  }, [])

  const submit = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const ticket = await createSupportTicket({ categoryId, subject, message, files })
      router.push(`${ticketsBasePath}/${ticket.ticketNo}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '제출 실패')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-semibold">문의하기</h1>
      <p className="text-xs text-gray-500">민감정보는 입력하지 마세요. 첨부파일은 비공개로 저장됩니다.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <select
        className="w-full border rounded-lg px-3 py-2 text-sm"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm"
        placeholder="제목"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        className="w-full border rounded-lg px-3 py-2 text-sm"
        rows={6}
        placeholder="문의 내용"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 3))}
      />
      <button
        type="button"
        disabled={busy || !subject.trim() || !message.trim()}
        onClick={() => void submit()}
        className="w-full py-3 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
      >
        {busy ? '제출 중…' : '문의 제출'}
      </button>
    </div>
  )
}
