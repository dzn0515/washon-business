'use client'

import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import { CARD } from '@/lib/dashboard-ui'
import type { OperationalInsight } from '@/lib/operational-insights'
import { Calendar, ChevronRight, Sparkles, TrendingUp, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const TYPE_ICONS: Record<OperationalInsight['type'], LucideIcon> = {
  revenue: TrendingUp,
  customer: Users,
  booking: Calendar,
  staff: Users,
}

const PRIORITY_STYLE = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-gray-100 text-gray-600',
}

const PRIORITY_LABEL = {
  high: '주의',
  medium: '참고',
  low: '참고',
}

type Props = {
  insights: OperationalInsight[]
  loading?: boolean
  isLive?: boolean
  isDemo?: boolean
  compact?: boolean
}

function InsightCard({ insight, compact }: { insight: OperationalInsight; compact?: boolean }) {
  const Icon = TYPE_ICONS[insight.type]
  const comingSoon = insight.status === 'coming_soon'

  return (
    <div className={`${CARD} ${comingSoon ? 'opacity-80' : ''}`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            comingSoon ? 'bg-gray-100' : 'bg-blue-50'
          }`}
        >
          <Icon size={18} className={comingSoon ? 'text-gray-400' : 'text-blue-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900">{insight.title}</h3>
            {insight.metric && !comingSoon ? (
              <span className="text-xs font-medium text-blue-600">{insight.metric}</span>
            ) : null}
            {comingSoon ? (
              <Badge className="bg-gray-100 text-gray-500">곧 제공</Badge>
            ) : (
              <Badge className={PRIORITY_STYLE[insight.priority]}>{PRIORITY_LABEL[insight.priority]}</Badge>
            )}
          </div>
          <p className={`text-sm mt-1.5 leading-relaxed ${comingSoon ? 'text-gray-400' : 'text-gray-600'}`}>
            {insight.summary}
          </p>
          {insight.action && !comingSoon && !compact ? (
            <p className="mt-2 text-xs text-gray-400">{insight.action}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function OperationalInsightsSection({
  insights,
  loading,
  isLive,
  isDemo,
  compact,
}: Props) {
  const { href } = useDemoMode()
  const liveInsights = insights.filter((i) => i.status === 'live')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" />
          <p className="text-[12px] text-gray-400 font-medium">AI 운영 인사이트</p>
        </div>
        {!compact ? (
          <Link
            href={href('/dashboard/ai')}
            className="text-xs text-blue-600 font-medium flex items-center gap-0.5"
          >
            전체보기 <ChevronRight size={14} />
          </Link>
        ) : null}
      </div>

      {isDemo ? (
        <p className="text-xs text-amber-600">데모 데이터 · 룰 기반 집계 미리보기</p>
      ) : isLive ? (
        <p className="text-xs text-gray-400">
          예약·고객 데이터 룰 기반 집계 {liveInsights.length > 0 ? `(${liveInsights.length}건)` : ''}
        </p>
      ) : !isLive && !loading ? (
        <p className="text-xs text-gray-400">데이터를 불러올 수 없습니다</p>
      ) : (
        <p className="text-xs text-gray-400">집계 준비 중입니다.</p>
      )}

      {loading ? (
        <div className={CARD}>
          <p className="text-sm text-gray-400 py-2">집계 중…</p>
        </div>
      ) : (
        insights.map((insight) => <InsightCard key={insight.id} insight={insight} compact={compact} />)
      )}
    </div>
  )
}
