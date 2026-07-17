'use client'

import Link from 'next/link'

const LINKS = [
  { href: '/dashboard/support/notices', title: '공지사항', desc: '본사 공지 확인' },
  { href: '/dashboard/support/faqs', title: 'FAQ', desc: '자주 묻는 질문' },
  { href: '/dashboard/support/new', title: '본사 문의', desc: '신규 문의 작성' },
  { href: '/dashboard/support/tickets', title: '문의내역', desc: '답변·진행 상태 확인' },
]

export default function OwnerSupportHomePage() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">고객센터</h1>
        <p className="text-sm text-gray-500 mt-1">본사 문의 · FAQ · 공지</p>
      </div>
      <div className="grid gap-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border bg-white p-4 hover:border-blue-300 transition"
          >
            <div className="font-medium">{l.title}</div>
            <div className="text-sm text-gray-500 mt-1">{l.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
