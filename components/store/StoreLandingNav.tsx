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
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-transparent transition-all duration-200 ${
        scrolled ? 'border-gray-100 bg-white shadow-sm' : 'bg-white/90 backdrop-blur-sm'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-14 w-full max-w-lg items-center px-4">
        <Link href="/" className="text-lg font-bold text-blue-600">
          AUTOON
        </Link>
      </div>
    </header>
  )
}
