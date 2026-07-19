'use client'

import { useState } from 'react'

const FAQ_ITEMS = [
  {
    q: '수수료는 얼마인가요?',
    a: 'Basic 월 28,000원(첫 3개월 무료), Standard 월 59,000원, Premium 월 99,000원입니다. 모두 VAT 별도이며 플랜별 예약 플랫폼 수수료가 적용됩니다.',
  },
  {
    q: '기존 네이버 예약과 같이 써도 되나요?',
    a: '가능합니다. 초기에는 기존 예약 채널과 병행 운영할 수 있습니다.',
  },
  {
    q: '스마트폰만 있어도 사용할 수 있나요?',
    a: '네. 사장님 웹은 PC와 모바일 브라우저 모두 지원합니다.',
  },
  {
    q: '계약 기간이 있나요?',
    a: '초기 3개월 무료 이후 월 단위 과금이며, 언제든 해지할 수 있습니다.',
  },
  {
    q: '세차장 외 다른 업종도 가능한가요?',
    a: '가능합니다. 디테일링샵, 광택샵, 썬팅샵, 타이어샵, 정비소 등 자동차 서비스 업체라면 입점할 수 있습니다.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">자주 묻는 질문</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const open = openIndex === i
            return (
              <div key={item.q} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenIndex(open ? null : i)}
                >
                  <span className="font-semibold text-gray-900 pr-4">Q. {item.q}</span>
                  <span className="text-gray-400 shrink-0">{open ? '−' : '+'}</span>
                </button>
                {open ? (
                  <div className="px-6 pb-4 text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {item.a}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
