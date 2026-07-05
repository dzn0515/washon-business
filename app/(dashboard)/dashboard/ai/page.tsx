'use client'

import OperationalInsightsSection from '@/components/dashboard/OperationalInsightsSection'
import { useOperationalInsights } from '@/lib/hooks/useOperationalInsights'
import { CARD } from '@/lib/dashboard-ui'
import { RefreshCw, Sparkles } from 'lucide-react'

export default function OperationalInsightsPage() {
  const { insights, loading, isLive, isDemo, liveCount, refetch } = useOperationalInsights()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI 운영 인사이트</h2>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={loading}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      <div className={`${CARD} bg-gradient-to-br from-slate-700 to-slate-800 text-white border-0`}>
        <p className="text-sm opacity-90">룰 기반 운영 집계</p>
        <p className="text-2xl font-bold mt-1">
          {isDemo ? '데모' : isLive ? `${liveCount}개 항목` : '연동 대기'}
        </p>
        <p className="text-sm mt-1 opacity-90">
          {isDemo
            ? '데모 화면 · 예약·고객 데이터 룰 기반 미리보기'
            : isLive
              ? '예약·고객 API 데이터를 바탕으로 한 운영 인사이트입니다'
              : '예약·고객 API 연동 후 인사이트가 표시됩니다'}
        </p>
      </div>

      <OperationalInsightsSection
        insights={insights}
        loading={loading}
        isLive={isLive}
        isDemo={isDemo}
      />
    </div>
  )
}
