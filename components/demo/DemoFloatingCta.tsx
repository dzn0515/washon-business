'use client'

import Link from 'next/link'

const JOIN_URL = 'https://autoon.kr/join'

export default function DemoFloatingCta() {
  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-40 max-w-[260px]">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
        <p className="text-xs text-blue-600 font-medium">첫 1개월 무료</p>
        <Link
          href={JOIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block w-full text-center py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors leading-snug"
        >
          사장님 프로그램 무료 체험 신청
        </Link>
      </div>
    </div>
  )
}
