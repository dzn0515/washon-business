'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { href: '/', label: '홈' },
  { href: '/#features', label: '기능' },
  { href: '/#pricing', label: '요금제' },
  { href: '/#ads', label: '광고' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/join', label: '입점 안내' },
  { href: '/about', label: '회사 소개' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow ${scrolled ? 'bg-white shadow-sm' : 'bg-white'}`}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          AUTOON
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/join"
            className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:border-gray-400 transition-colors"
          >
            입점 신청
          </Link>
          <a
            href="https://business.autoon.kr/login"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            사장님 로그인
          </a>
        </nav>

        <button
          type="button"
          className="lg:hidden p-2 text-gray-700"
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open ? (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm text-gray-700 py-2"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/join"
            className="block text-center text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-xl"
            onClick={() => setOpen(false)}
          >
            입점 신청
          </Link>
          <a
            href="https://business.autoon.kr/login"
            className="block text-center text-sm bg-blue-600 text-white px-4 py-2 rounded-xl"
            onClick={() => setOpen(false)}
          >
            사장님 로그인
          </a>
        </div>
      ) : null}
    </header>
  )
}
