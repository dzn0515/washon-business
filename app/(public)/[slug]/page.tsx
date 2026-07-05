'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { isReservedStoreSlug } from '@/lib/reserved-slugs'
import {
  ArrowLeft,
  Calendar,
  Car,
  Clock,
  Heart,
  Info,
  MapPin,
  Phone,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react'

type Tab = 'menu' | 'review' | 'info'

const store = {
  name: '반짝반짝 손세차',
  rating: 4.9,
  reviewCount: 127,
  distance: '0.4km',
  hours: '09:00~20:00',
  address: '강원도 원주시 무실로 42',
  phone: '033-123-4567',
  bays: 3,
  isOpen: true,
  tags: ['손세차', '실내세차', '유리막코팅', '주차가능', '즉시예약'],
}

const menus = [
  {
    id: '1',
    name: '기본 외부 세차',
    description: '외관 전체 거품세차 + 물기제거 + 유리 닦기',
    duration: 40,
    isPopular: true,
    prices: {
      small: { domestic: 20000, imported: 25000 },
      medium: { domestic: 25000, imported: 30000 },
      large: { domestic: 30000, imported: 38000 },
    },
  },
  {
    id: '2',
    name: '실내+외부 풀세차',
    description: '외부 세차 + 실내 진공청소 + 대시보드 닦기',
    duration: 90,
    isPopular: false,
    prices: {
      small: { domestic: 35000, imported: 45000 },
      medium: { domestic: 45000, imported: 55000 },
      large: { domestic: 55000, imported: 68000 },
    },
  },
  {
    id: '3',
    name: '유리막 코팅',
    description: '발수 유리막 코팅 · 3~6개월 지속',
    duration: 120,
    isPopular: false,
    prices: {
      small: { domestic: 60000, imported: 80000 },
      medium: { domestic: 80000, imported: 100000 },
      large: { domestic: 100000, imported: 130000 },
    },
  },
  {
    id: '4',
    name: '엔진룸 세척',
    description: '엔진룸 고압 스팀 세척 · 방청 처리 포함',
    duration: 60,
    isPopular: false,
    prices: {
      small: { domestic: 35000, imported: 45000 },
      medium: { domestic: 35000, imported: 45000 },
      large: { domestic: 35000, imported: 45000 },
    },
  },
]

const reviews = [
  {
    id: '1',
    name: '김민준',
    date: '2026.06.18',
    menu: '기본 외부 세차',
    rating: 5,
    content: '꼼꼼하게 닦아주셔서 너무 만족해요. 40분 정도 걸렸고 차가 새 차처럼 됐어요.',
    tags: ['꼼꼼해요', '친절해요', '재방문 의사 있음'],
  },
  {
    id: '2',
    name: '이수진',
    date: '2026.06.12',
    menu: '실내+외부 풀세차',
    rating: 5,
    content: '앱으로 예약하고 바로 방문했어요. 실내까지 깨끗하게 해주시고 사장님이 너무 친절하세요!',
    tags: ['친절해요', '예약이 편해요'],
  },
  {
    id: '3',
    name: '박현우',
    date: '2026.05.30',
    menu: '유리막 코팅',
    rating: 4,
    content: '코팅 퀄리티는 좋은데 대기가 조금 있었어요. 예약 시스템 생겨서 다음엔 편할 것 같아요.',
    tags: ['퀄리티 좋아요'],
  },
]

const RATING_DIST = [
  { star: 5, pct: 88 },
  { star: 4, pct: 8 },
  { star: 3, pct: 3 },
  { star: 2, pct: 1 },
  { star: 1, pct: 0 },
]

const VEHICLE_ROWS = [
  { key: 'small' as const, label: '소형', badge: 'bg-green-50 text-green-700', examples: '모닝·아반떼' },
  { key: 'medium' as const, label: '중형', badge: 'bg-blue-50 text-blue-700', examples: '쏘나타·그랜저' },
  { key: 'large' as const, label: '대형', badge: 'bg-amber-50 text-amber-700', examples: '카니발·팰리세이드' },
]

const TABS: { key: Tab; label: string }[] = [
  { key: 'menu', label: '메뉴' },
  { key: 'review', label: '리뷰' },
  { key: 'info', label: '정보' },
]

function formatPrice(amount: number) {
  return `${amount.toLocaleString()}원`
}

function Stars({ count, size = 12 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex text-amber-400" style={{ fontSize: size }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} fill={i < count ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}

export default function PublicShopPage() {
  const router = useRouter()
  const params = useParams()
  const slug = String(params.slug ?? 'sparkling')
  const [tab, setTab] = useState<Tab>('menu')
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (slug === 'demo') {
      router.replace('/demo')
    }
  }, [slug, router])

  if (slug === 'demo') {
    return null
  }

  if (isReservedStoreSlug(slug)) {
    notFound()
  }

  const infoGrid = [
    { icon: MapPin, label: '주소', value: store.address },
    { icon: Phone, label: '전화', value: store.phone },
    { icon: Car, label: '베이', value: `${store.bays}개` },
    { icon: Clock, label: '영업', value: store.hours },
  ]

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24">
      {/* 1. 히어로 */}
      <div className="relative h-[180px] bg-gray-100 flex items-center justify-center">
        <Car className="text-gray-300" size={48} />
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="text-white" size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.share) {
              navigator.share({ title: store.name, url: window.location.href }).catch(() => {})
            }
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
          aria-label="공유"
        >
          <Share2 className="text-white" size={18} />
        </button>
        {store.isOpen && (
          <span className="absolute bottom-2 right-3 bg-green-600 text-white text-xs px-2.5 py-1 rounded-full font-medium">
            영업중
          </span>
        )}
      </div>

      {/* 2. 매장 정보 */}
      <div className="px-4 pt-4">
        <h1 className="text-[18px] font-semibold text-gray-900 mb-1">{store.name}</h1>
        <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-2 flex-wrap">
          <Star className="text-amber-400 shrink-0" size={13} fill="currentColor" />
          <span>{store.rating}</span>
          <span>·</span>
          <span>리뷰 {store.reviewCount}개</span>
          <span>·</span>
          <span>{store.distance}</span>
          <span>·</span>
          <span>{store.hours}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {store.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {infoGrid.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
              <Icon className="text-[#1A6DFF] shrink-0 mt-0.5" size={15} />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400">{label}</p>
                <p className="text-[13px] font-medium text-gray-900 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 탭 바 */}
      <div className="sticky top-0 z-10 flex border-b border-gray-200 bg-white">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-[13px] text-center cursor-pointer ${
              tab === t.key
                ? 'text-[#1A6DFF] border-b-2 border-[#1A6DFF] font-medium'
                : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 4. 메뉴 탭 */}
      {tab === 'menu' && (
        <div className="px-4 py-3">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className={`border rounded-xl p-3 mb-2 ${
                menu.isPopular ? 'border-[#1A6DFF]' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="text-blue-400" size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-medium text-gray-900">{menu.name}</span>
                    {menu.isPopular && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        인기
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-500 mt-0.5">{menu.description}</p>
                  <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                    <Clock size={11} />
                    약 {menu.duration}분
                  </p>
                </div>
              </div>

              <table className="w-full border-collapse mt-1">
                <thead>
                  <tr>
                    <th className="w-[28%]" />
                    <th className="text-[11px] text-blue-600 font-medium text-center bg-blue-50/50 py-1.5 rounded-tl-lg">
                      🇰🇷 국산차
                    </th>
                    <th className="text-[11px] text-purple-600 font-medium text-center bg-purple-50/50 py-1.5 rounded-tr-lg">
                      🌐 수입차
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {VEHICLE_ROWS.map((row) => (
                    <tr key={row.key}>
                      <td className="py-2 pr-2 align-top">
                        <span
                          className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium ${row.badge}`}
                        >
                          {row.label}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">[{row.examples}]</p>
                      </td>
                      <td className="text-[13px] font-medium text-gray-900 text-center bg-blue-50/30 py-2">
                        {formatPrice(menu.prices[row.key].domestic)}
                      </td>
                      <td className="text-[13px] font-medium text-purple-700 text-center bg-purple-50/30 py-2">
                        {formatPrice(menu.prices[row.key].imported)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-[#1A6DFF] text-white flex items-center justify-center text-lg cursor-pointer"
                          aria-label="메뉴 추가"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* 5. 리뷰 탭 */}
      {tab === 'review' && (
        <div className="px-4 py-3">
          <div className="flex gap-4 items-center pb-3 mb-3 border-b border-gray-100">
            <div className="shrink-0">
              <p className="text-[36px] font-semibold text-gray-900 leading-none">{store.rating}</p>
              <div className="mt-1">
                <Stars count={5} size={13} />
              </div>
              <p className="text-[12px] text-gray-500 mt-1">리뷰 {store.reviewCount}개</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {RATING_DIST.map((r) => (
                <div key={r.star} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 w-3">{r.star}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {reviews.map((review) => (
            <div key={review.id} className="pb-3 mb-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[12px] font-medium shrink-0">
                  {review.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-gray-900">{review.name}</span>
                    <span className="text-[11px] text-gray-400 shrink-0">{review.date}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">{review.menu}</p>
                </div>
              </div>
              <div className="mb-1">
                <Stars count={review.rating} size={12} />
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed">{review.content}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {review.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. 정보 탭 */}
      {tab === 'info' && (
        <div className="px-4 py-3 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <MapPin className="text-[#1A6DFF] shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-[12px] text-gray-400 mb-1">주소</p>
              <p className="text-[13px] text-gray-900 leading-relaxed">
                {store.address} (무실동)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="text-[#1A6DFF] shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-[12px] text-gray-400 mb-1">영업시간</p>
              <p className="text-[13px] text-gray-900 leading-relaxed whitespace-pre-line">
                {`월~금 09:00 ~ 20:00\n토 09:00 ~ 18:00\n일 10:00 ~ 18:00`}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">* 우천·악천후 시 임시 휴무</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Info className="text-[#1A6DFF] shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-[12px] text-gray-400 mb-1">안내사항</p>
              <p className="text-[13px] text-gray-900 leading-relaxed whitespace-pre-line">
                {`예약 48시간 전까지 무료 취소\n노쇼 시 다음 예약 제한될 수 있어요\n주차 공간 3대 가능`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-20">
        <div className="flex gap-3 items-center max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setLiked((v) => !v)}
            className="w-11 h-11 border border-gray-200 rounded-xl flex items-center justify-center shrink-0"
            aria-label="찜하기"
          >
            <Heart
              className={liked ? 'text-red-500 fill-red-500' : 'text-gray-400'}
              size={20}
            />
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${slug}/booking`)}
            className="flex-1 h-11 bg-[#1A6DFF] text-white rounded-xl font-medium text-[14px] flex items-center justify-center gap-1.5"
          >
            <Calendar size={16} />
            예약하기
          </button>
        </div>
      </div>
    </div>
  )
}
