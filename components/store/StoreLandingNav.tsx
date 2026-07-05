'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function StoreLandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-white shadow-sm' : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-blue-600 font-bold text-xl">AUTOON</span>
        </Link>
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <li>
            <Link href="/join" className="hover:text-blue-600 transition-colors">
              입점 안내
            </Link>
          </li>
          <li>
            <Link href="/about" className="hover:text-blue-600 transition-colors">
              회사 소개
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}
