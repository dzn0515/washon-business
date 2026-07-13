'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ExternalLink,
  ImageIcon,
  List,
  Megaphone,
  QrCode,
  RefreshCw,
  Ticket,
  Clock,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useBusinessMe } from '@/lib/hooks/useBusinessMe'
import { getBusinessTypeLabel } from '@/lib/business-types'
import { updateBusinessMe } from '@/lib/store-api'
import { CARD } from '@/lib/dashboard-ui'

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

function normalizeBrandColor(value: string): string {
  const trimmed = value.trim()
  if (!HEX_COLOR_RE.test(trimmed)) return trimmed
  return `#${trimmed.slice(1).toUpperCase()}`
}

function isValidBrandColor(value: string): boolean {
  return HEX_COLOR_RE.test(value.trim())
}

const RELATED_LINKS = [
  {
    href: '/dashboard/settings',
    title: '매장 이미지 관리',
    description: '대표 이미지와 로고는 설정에서 관리합니다.',
    icon: ImageIcon,
  },
  {
    href: '/dashboard/menus',
    title: '메뉴 및 가격 관리',
    description: '고객앱에 표시되는 서비스와 가격은 메뉴/요금에서 관리합니다.',
    icon: List,
  },
  {
    href: '/dashboard/menus',
    title: '영업시간 관리',
    description: '영업시간은 메뉴/요금 화면의 영업시간 탭에서 관리합니다.',
    icon: Clock,
  },
  {
    href: '/dashboard/marketing/coupons',
    title: '쿠폰 관리',
    description: '고객에게 발급·노출되는 쿠폰은 쿠폰 관리에서 다룹니다.',
    icon: Ticket,
  },
  {
    href: '/dashboard/ads',
    title: '광고·노출 상품',
    description: '앱 노출·광고 상품은 앱 노출 관리에서 신청합니다.',
    icon: Megaphone,
  },
  {
    href: '/dashboard/qr',
    title: '매장 QR 관리',
    description: '매장 전용 QR은 매장 QR 메뉴에서 확인합니다.',
    icon: QrCode,
  },
] as const

export default function StoreAppPage() {
  const { business, loading, error, isDemo, refetch } = useBusinessMe()

  const [draftColor, setDraftColor] = useState('#1A6DFF')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const savedColor = useMemo(
    () => normalizeBrandColor(business?.brand_color || '#1A6DFF'),
    [business?.brand_color],
  )

  useEffect(() => {
    if (business?.brand_color) {
      setDraftColor(normalizeBrandColor(business.brand_color))
    } else if (business) {
      setDraftColor('#1A6DFF')
    }
  }, [business])

  const draftNormalized = normalizeBrandColor(draftColor)
  const draftValid = isValidBrandColor(draftColor)
  const dirty = draftValid && draftNormalized !== savedColor

  const publicUrl = business?.slug
    ? `https://autoon.kr/store/${encodeURIComponent(business.slug)}`
    : null

  async function handleSaveColor() {
    if (!business || isDemo || !draftValid || !dirty) return
    setSaving(true)
    setSaveMessage(null)
    setSaveError(null)
    try {
      const updated = await updateBusinessMe({ brand_color: draftNormalized })
      setDraftColor(normalizeBrandColor(updated.brand_color || draftNormalized))
      setSaveMessage('브랜드 색상이 저장되었습니다. 고객앱 공개 화면에 반영됩니다.')
      await refetch()
    } catch (e) {
      setSaveError((e as Error).message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (isDemo) {
    return (
      <div className="space-y-4 pb-8">
        <p className="text-sm text-gray-500">
          고객이 보는 매장 페이지의 브랜드 색상과 노출 상태를 확인합니다. 매장 이미지, 메뉴, 쿠폰과
          영업시간은 각 관리 메뉴에서 수정할 수 있습니다.
        </p>
        <div className={CARD}>
          <p className="text-sm text-gray-600">
            데모 모드에서는 운영 API 저장을 사용할 수 없습니다. localStorage 기반 편집기는{' '}
            <Link href="/demo/store-app" className="text-blue-600 underline">
              /demo/store-app
            </Link>
            을 이용해 주세요.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-8">
        <p className="text-sm text-gray-400">매장 정보를 불러오는 중…</p>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="space-y-4 pb-8">
        <div className={CARD}>
          <p className="text-sm text-red-600">{error || '매장 정보를 불러올 수 없습니다.'}</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => void refetch()}>
            <RefreshCw size={14} className="mr-1" />
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  const bizLabel = getBusinessTypeLabel(business.biz_type ?? 'wash')
  const logoUrl = business.logo_url || ''
  const bannerUrl = business.banner_url || ''
  const previewColor = draftValid ? draftNormalized : savedColor

  return (
    <div className="space-y-4 pb-8">
      <div>
        <p className="text-sm text-gray-500">
          고객이 보는 매장 페이지의 브랜드 색상과 노출 상태를 확인합니다. 매장 이미지, 메뉴, 쿠폰과
          영업시간은 각 관리 메뉴에서 수정할 수 있습니다.
        </p>
      </div>

      <Card title="고객앱 매장 미리보기">
        <p className="text-xs text-gray-400 mb-3">간단 미리보기 · 실제 고객앱 UI와 완전히 동일하지 않을 수 있습니다.</p>
        <div
          className="rounded-xl overflow-hidden border border-gray-200 max-w-md"
          style={{ borderTop: `4px solid ${previewColor}` }}
        >
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="대표 이미지" className="w-full h-28 object-cover bg-gray-100" />
          ) : (
            <div className="h-28 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              대표 이미지 없음 · 설정에서 업로드
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="로고" className="w-11 h-11 rounded-lg object-cover bg-gray-50" />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                  💧
                </div>
              )}
              <div>
                <div className="font-bold text-base text-gray-900">{business.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{bizLabel}</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">{business.address || '주소 미등록'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{business.phone || '연락처 미등록'}</p>
            <button
              type="button"
              disabled
              className="w-full mt-4 py-2.5 rounded-xl text-white text-sm font-medium opacity-90 cursor-default"
              style={{ backgroundColor: previewColor }}
            >
              예약하기
            </button>
          </div>
        </div>
      </Card>

      <Card title="브랜드 색상 설정">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">색상</label>
            <input
              type="color"
              value={draftValid ? draftNormalized : savedColor}
              onChange={(e) => {
                setDraftColor(normalizeBrandColor(e.target.value))
                setSaveMessage(null)
                setSaveError(null)
              }}
              className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200"
            />
          </div>
          <div className="space-y-1 flex-1 min-w-[140px] max-w-xs">
            <label className="text-xs font-medium text-gray-500">HEX (#RRGGBB)</label>
            <Input
              value={draftColor}
              onChange={(e) => {
                setDraftColor(e.target.value)
                setSaveMessage(null)
                setSaveError(null)
              }}
              placeholder="#1A6DFF"
              className="font-mono"
            />
          </div>
          <Button size="sm" disabled={!dirty || saving} onClick={() => void handleSaveColor()}>
            {saving ? '저장 중…' : '저장'}
          </Button>
        </div>
        {!draftValid && (
          <p className="text-xs text-red-500 mt-2">#RRGGBB 형식만 저장할 수 있습니다. 예: #1A6DFF</p>
        )}
        {saveMessage && <p className="text-xs text-green-600 mt-2">{saveMessage}</p>}
        {saveError && <p className="text-xs text-red-600 mt-2">{saveError}</p>}
        <p className="text-[11px] text-gray-400 mt-2">
          저장 시 <code className="text-gray-500">PATCH /business/me</code>로{' '}
          <code className="text-gray-500">partners.brand_color</code>만 갱신합니다.
        </p>
      </Card>

      <Card title="현재 반영 정보 요약">
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <SummaryRow label="매장명" value={business.name} />
          <SummaryRow label="slug" value={business.slug || '—'} />
          <SummaryRow label="업종" value={bizLabel} />
          <SummaryRow label="전화번호" value={business.phone || '—'} />
          <SummaryRow label="주소" value={business.address || '—'} className="sm:col-span-2" />
          <SummaryRow label="브랜드 색상" value={savedColor} />
          <SummaryRow
            label="로고"
            value={logoUrl ? '등록됨' : '미등록 (설정에서 업로드)'}
          />
          <SummaryRow
            label="대표 이미지"
            value={bannerUrl ? '등록됨' : '미등록 (설정에서 업로드)'}
          />
        </dl>
        {(logoUrl || bannerUrl) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="로고" className="w-14 h-14 rounded-lg object-cover border border-gray-100" />
            ) : null}
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerUrl}
                alt="대표"
                className="h-14 w-28 rounded-lg object-cover border border-gray-100"
              />
            ) : null}
          </div>
        )}
      </Card>

      <Card title="관련 관리 메뉴">
        <ul className="space-y-2">
          {RELATED_LINKS.map((item) => {
            const Icon = item.icon
            return (
              <li key={`${item.href}-${item.title}`}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card title="고객앱 매장 페이지">
        <div className="flex flex-wrap items-center gap-2">
          <Input value={publicUrl ?? ''} readOnly className="text-xs font-mono flex-1 min-w-[200px]" />
          {publicUrl ? (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm">
                <ExternalLink size={14} className="mr-1" />
                고객앱 매장 페이지 열기
              </Button>
            </a>
          ) : (
            <Button size="sm" disabled>
              고객앱 매장 페이지 열기
            </Button>
          )}
        </div>
        {!business.slug && (
          <p className="text-xs text-amber-700 mt-2">매장 slug가 없어 공개 페이지 URL을 만들 수 없습니다.</p>
        )}
      </Card>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-800 mt-0.5 break-all">{value}</dd>
    </div>
  )
}
