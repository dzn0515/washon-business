'use client'

import Link from 'next/link'

export default function PortalSupportHome({ basePath }: { basePath: string }) {
  const links = [
    { href: `${basePath}/notices`, title: '공지사항' },
    { href: `${basePath}/faqs`, title: 'FAQ' },
    { href: `${basePath}/new`, title: '문의하기' },
    { href: `${basePath}/tickets`, title: '문의내역' },
  ]
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-semibold">고객센터</h1>
      <div className="grid gap-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-xl border bg-white p-4 hover:border-blue-300">
            {l.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
