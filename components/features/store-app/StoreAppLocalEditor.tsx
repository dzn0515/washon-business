'use client'

import { useState } from 'react'
import { Copy, Download, ExternalLink, Eye, RotateCcw, Smartphone } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Field, VisibilityToggle } from '@/components/features/store-app/form-fields'
import { getStoreAppDeepLink, getStoreAppWebUrl, toCustomerStoreSnapshot, downloadStoreAppExport, serializeStoreAppExport } from '@/lib/store-app/export'
import { useStoreApp } from '@/lib/store-app/store'
import { won } from '@/lib/dashboard-ui'
import { Plus, Trash2 } from 'lucide-react'

/** Demo/DEV only — localStorage editor. Do not import from production `/dashboard/store-app`. */
export default function StoreAppLocalEditor() {
  const {
    profile,
    setStore,
    updateService,
    addService,
    removeService,
    updateCoupon,
    addCoupon,
    removeCoupon,
    updateEvent,
    addEvent,
    removeEvent,
    resetProfile,
  } = useStoreApp()

  const [previewOpen, setPreviewOpen] = useState(false)
  const [copied, setCopied] = useState<'web' | 'deeplink' | 'export' | null>(null)

  const { store, services, coupons, events } = profile
  const snapshot = toCustomerStoreSnapshot(profile)
  const webUrl = getStoreAppWebUrl(store.slug)
  const deepLink = getStoreAppDeepLink(store.slug)

  async function copyText(text: string, kind: 'web' | 'deeplink' | 'export') {
    await navigator.clipboard.writeText(text)
    setCopied(kind)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleExportDownload() {
    downloadStoreAppExport(profile)
  }

  function handleExportCopy() {
    copyText(serializeStoreAppExport(profile), 'export')
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 bg-gray-50/95 backdrop-blur py-2 -mx-1 px-1">
        <div>
          <p className="text-sm text-gray-500">
            [데모] 고객앱 매장 화면 편집기입니다. 변경 내용은 브라우저에만 임시 저장되며 운영 API에 반영되지 않습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCopy}>
            <Copy size={14} className="mr-1" />
            설정 복사
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportDownload}>
            <Download size={14} className="mr-1" />
            설정 내보내기
          </Button>
          <Button variant="secondary" size="sm" onClick={resetProfile}>
            <RotateCcw size={14} className="mr-1" />
            초기화
          </Button>
          <Button size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye size={14} className="mr-1" />
            고객앱 미리보기
          </Button>
        </div>
        {copied === 'export' && (
          <p className="text-xs text-green-600 mt-1">설정 JSON이 클립보드에 복사되었습니다. 고객앱 개발 화면에서 붙여넣으세요.</p>
        )}
      </div>

      <Card title="매장 기본 정보">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="매장명">
            <Input value={store.name} onChange={(e) => setStore({ name: e.target.value })} />
          </Field>
          <Field label="매장 slug (URL 주소)">
            <Input
              value={store.slug}
              onChange={(e) => setStore({ slug: e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase() })}
              placeholder="예: sparkling"
            />
          </Field>
          <Field label="전화번호">
            <Input value={store.phone} onChange={(e) => setStore({ phone: e.target.value })} />
          </Field>
          <Field label="영업시간">
            <Input
              value={store.hours}
              onChange={(e) => setStore({ hours: e.target.value })}
              placeholder="09:00~20:00"
            />
          </Field>
          <Field label="주소" className="sm:col-span-2">
            <Input value={store.address} onChange={(e) => setStore({ address: e.target.value })} />
          </Field>
          <Field label="소개 문구" className="sm:col-span-2">
            <textarea
              value={store.description}
              onChange={(e) => setStore({ description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </Field>
          <Field label="브랜드 컬러">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={store.brandColor}
                onChange={(e) => setStore({ brandColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
              <Input value={store.brandColor} onChange={(e) => setStore({ brandColor: e.target.value })} />
            </div>
          </Field>
        </div>

        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          로고·대표 이미지·시공사진은{' '}
          <a href="/dashboard/settings" className="underline font-medium">
            설정 → 매장 이미지
          </a>
          에서 파일로 업로드하세요. (URL 직접 입력은 더 이상 사용하지 않습니다)
        </div>

        {(store.bannerUrl || store.logoUrl) && (
          <div className="mt-4 rounded-xl overflow-hidden border border-gray-100">
            {store.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.bannerUrl} alt="대표 이미지" className="w-full h-32 object-cover bg-gray-100" />
            ) : (
              <div className="h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                대표 이미지 미리보기
              </div>
            )}
            <div className="p-3 flex items-center gap-3" style={{ borderTop: `3px solid ${store.brandColor}` }}>
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl} alt="로고" className="w-10 h-10 rounded-lg object-cover bg-gray-50" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">💧</div>
              )}
              <div>
                <div className="font-semibold text-sm">{store.name}</div>
                <div className="text-xs text-gray-400">{store.hours}</div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card title="서비스 메뉴">
        <div className="flex justify-end mb-3">
          <Button size="sm" variant="secondary" onClick={addService}>
            <Plus size={14} className="mr-1" />
            서비스 추가
          </Button>
        </div>
        <div className="space-y-3">
          {services.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-xl p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-gray-400">서비스 #{item.id}</span>
                <div className="flex items-center gap-2">
                  <VisibilityToggle
                    checked={item.isVisible}
                    onChange={(v) => updateService(item.id, { isVisible: v })}
                  />
                  <button
                    type="button"
                    onClick={() => removeService(item.id)}
                    className="text-gray-300 hover:text-red-500 p-1"
                    aria-label="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="서비스명">
                  <Input
                    value={item.name}
                    onChange={(e) => updateService(item.id, { name: e.target.value })}
                  />
                </Field>
                <Field label="가격 (원)">
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateService(item.id, { price: Number(e.target.value) || 0 })}
                  />
                </Field>
                <Field label="소요시간 (분)">
                  <Input
                    type="number"
                    value={item.durationMinutes}
                    onChange={(e) =>
                      updateService(item.id, { durationMinutes: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label="설명" className="sm:col-span-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateService(item.id, { description: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">등록된 서비스가 없습니다.</p>
          )}
        </div>
      </Card>

      <Card title="쿠폰">
        <div className="flex justify-end mb-3">
          <Button size="sm" variant="secondary" onClick={addCoupon}>
            <Plus size={14} className="mr-1" />
            쿠폰 추가
          </Button>
        </div>
        <div className="space-y-3">
          {coupons.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-xl p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-gray-400">쿠폰 #{item.id}</span>
                <div className="flex items-center gap-2">
                  <VisibilityToggle
                    checked={item.isVisible}
                    onChange={(v) => updateCoupon(item.id, { isVisible: v })}
                  />
                  <button
                    type="button"
                    onClick={() => removeCoupon(item.id)}
                    className="text-gray-300 hover:text-red-500 p-1"
                    aria-label="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="쿠폰명">
                  <Input
                    value={item.name}
                    onChange={(e) => updateCoupon(item.id, { name: e.target.value })}
                  />
                </Field>
                <Field label="할인 유형">
                  <select
                    value={item.discountType}
                    onChange={(e) =>
                      updateCoupon(item.id, {
                        discountType: e.target.value as 'FIXED' | 'PERCENT',
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
                  >
                    <option value="FIXED">정액 할인 (원)</option>
                    <option value="PERCENT">정률 할인 (%)</option>
                  </select>
                </Field>
                <Field label={item.discountType === 'FIXED' ? '할인금액 (원)' : '할인율 (%)'}>
                  <Input
                    type="number"
                    value={item.discountValue}
                    onChange={(e) =>
                      updateCoupon(item.id, { discountValue: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label="사용기간 (시작)">
                  <Input
                    type="date"
                    value={item.validFrom}
                    onChange={(e) => updateCoupon(item.id, { validFrom: e.target.value })}
                  />
                </Field>
                <Field label="사용기간 (종료)">
                  <Input
                    type="date"
                    value={item.validUntil}
                    onChange={(e) => updateCoupon(item.id, { validUntil: e.target.value })}
                  />
                </Field>
                <Field label="설명" className="sm:col-span-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateCoupon(item.id, { description: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="이벤트">
        <div className="flex justify-end mb-3">
          <Button size="sm" variant="secondary" onClick={addEvent}>
            <Plus size={14} className="mr-1" />
            이벤트 추가
          </Button>
        </div>
        <div className="space-y-3">
          {events.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-xl p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-gray-400">이벤트 #{item.id}</span>
                <div className="flex items-center gap-2">
                  <VisibilityToggle
                    checked={item.isVisible}
                    onChange={(v) => updateEvent(item.id, { isVisible: v })}
                  />
                  <button
                    type="button"
                    onClick={() => removeEvent(item.id)}
                    className="text-gray-300 hover:text-red-500 p-1"
                    aria-label="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="이벤트 제목">
                  <Input
                    value={item.title}
                    onChange={(e) => updateEvent(item.id, { title: e.target.value })}
                  />
                </Field>
                <Field label="기간">
                  <Input
                    value={item.period}
                    onChange={(e) => updateEvent(item.id, { period: e.target.value })}
                    placeholder="2026.06.01 ~ 2026.08.31"
                  />
                </Field>
                <Field label="이벤트 설명" className="sm:col-span-2">
                  <textarea
                    value={item.description}
                    onChange={(e) => updateEvent(item.id, { description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="고객앱 미리보기" size="lg">
        <div className="space-y-4">
          <div
            className="rounded-xl overflow-hidden border border-gray-200"
            style={{ borderTop: `4px solid ${store.brandColor}` }}
          >
            <div className="h-28 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              {store.bannerUrl ? '대표 이미지' : '배너 영역'}
            </div>
            <div className="p-4">
              <div className="font-bold text-lg">{store.name}</div>
              <div className="text-xs text-gray-500 mt-1">{store.address}</div>
              <div className="text-xs text-gray-400 mt-0.5">{store.hours} · {store.phone}</div>
              <p className="text-sm text-gray-600 mt-2">{store.description}</p>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-gray-400">노출 서비스 ({snapshot.services.length})</p>
                {snapshot.services.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span>{s.name}</span>
                    <span style={{ color: store.brandColor }}>{won(s.basePrice)}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="w-full mt-4 py-2.5 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: store.brandColor }}
              >
                예약하기
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Smartphone size={14} />
              앱 딥링크
            </p>
            <div className="flex gap-2">
              <Input value={deepLink} readOnly className="text-xs font-mono" />
              <Button size="sm" variant="secondary" onClick={() => copyText(deepLink, 'deeplink')}>
                <Copy size={14} />
              </Button>
            </div>
            {copied === 'deeplink' && <p className="text-xs text-green-600">딥링크가 복사되었습니다.</p>}
            <p className="text-[11px] text-gray-400">
              adb: adb shell am start -W -a android.intent.action.VIEW -d &quot;{deepLink}&quot; host.exp.exponent
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">웹 매장 페이지</p>
            <div className="flex gap-2">
              <Input value={webUrl} readOnly className="text-xs" />
              <Button size="sm" variant="secondary" onClick={() => copyText(webUrl, 'web')}>
                <Copy size={14} />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(`/${store.slug}`, '_blank')}
              >
                <ExternalLink size={14} />
              </Button>
            </div>
            {copied === 'web' && <p className="text-xs text-green-600">URL이 복사되었습니다.</p>}
          </div>

          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
            고객앱 경로: <code className="text-gray-600">/store/{store.slug}</code>
            · 노출 쿠폰 {snapshot.coupons.length}개 · 노출 이벤트 {snapshot.events.length}개
          </p>
        </div>
      </Modal>
    </div>
  )
}
