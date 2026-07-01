'use client'

import { Fragment, useState } from 'react'

const TABS = [
  { id: 'bookings', label: '오늘 예약 현황' },
  { id: 'calendar', label: '베이 캘린더' },
  { id: 'crm', label: '고객 CRM' },
  { id: 'revenue', label: '매출 관리' },
]

export default function DashboardPreview() {
  const [active, setActive] = useState('bookings')

  return (
    <section id="dashboard-preview" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">이런 화면으로 매장을 관리합니다</h2>
          <p className="mt-4 text-lg text-gray-600">PC와 모바일 브라우저에서 모두 사용할 수 있습니다.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                active === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 min-h-[280px]">
          {active === 'bookings' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 pr-4 font-medium">날짜</th>
                    <th className="pb-3 pr-4 font-medium">예약자</th>
                    <th className="pb-3 pr-4 font-medium">메뉴</th>
                    <th className="pb-3 pr-4 font-medium">베이</th>
                    <th className="pb-3 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: '06/20', name: '김○○', menu: '실내외 세차', bay: 'A', status: '확정' },
                    { date: '06/20', name: '이○○', menu: '디테일링', bay: 'B', status: '확정' },
                    { date: '06/20', name: '박○○', menu: '광택', bay: 'C', status: '대기' },
                    { date: '06/20', name: '최○○', menu: '실내 크리닝', bay: 'A', status: '확정' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-3 pr-4 text-gray-800">{row.date}</td>
                      <td className="py-3 pr-4 text-gray-800">{row.name}</td>
                      <td className="py-3 pr-4 text-gray-600">{row.menu}</td>
                      <td className="py-3 pr-4 text-gray-600">{row.bay}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            row.status === '확정' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {active === 'calendar' ? (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-4 gap-2 min-w-[480px]">
                <div className="text-xs font-medium text-gray-500 p-2" />
                {['10:00', '11:00', '12:00', '13:00'].map((t) => (
                  <div key={t} className="text-xs font-medium text-gray-500 p-2 text-center">
                    {t}
                  </div>
                ))}
                {['베이 A', '베이 B', '베이 C'].map((bay) => (
                  <Fragment key={bay}>
                    <div className="text-xs font-medium text-gray-700 p-2 flex items-center">
                      {bay}
                    </div>
                    {[0, 1, 2, 3].map((col) => (
                      <div
                        key={`${bay}-${col}`}
                        className={`h-12 rounded-lg border ${
                          (bay === '베이 A' && col === 0) || (bay === '베이 B' && col === 2)
                            ? 'bg-blue-100 border-blue-200'
                            : (bay === '베이 C' && col === 1)
                              ? 'bg-green-100 border-green-200'
                              : 'bg-gray-50 border-gray-100'
                        }`}
                      />
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          ) : null}

          {active === 'crm' ? (
            <div className="space-y-3">
              {[
                { name: '김○○', visits: 12, last: '2026-06-18', vip: true },
                { name: '이○○', visits: 5, last: '2026-06-15', vip: true },
                { name: '박○○', visits: 2, last: '2026-06-10', vip: false },
                { name: '최○○', visits: 1, last: '2026-06-08', vip: false },
              ].map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 text-sm"
                >
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <span className="text-gray-500">{c.visits}회 방문</span>
                  <span className="text-gray-500">마지막 {c.last}</span>
                  {c.vip ? (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">단골</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">일반</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          {active === 'revenue' ? (
            <div>
              <p className="text-sm text-gray-500">이번 달 매출</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">₩4,280,000</p>
              <p className="text-sm text-gray-500 mt-6 mb-3">이번 주 매출</p>
              <div className="flex items-end gap-3 h-32">
                {[
                  { day: '월', h: 40 },
                  { day: '화', h: 65 },
                  { day: '수', h: 55 },
                  { day: '목', h: 80 },
                  { day: '금', h: 90 },
                  { day: '토', h: 100 },
                  { day: '일', h: 70 },
                ].map((bar) => (
                  <div key={bar.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-blue-600 rounded-t" style={{ height: `${bar.h}%` }} />
                    <span className="text-xs text-gray-500">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
