'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  ChevronLeft,
  Clock,
  MapPin,
  Phone,
  Star,
  X,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import {
  type AvailableSlot,
  type PublicBookingResult,
  type PublicBusiness,
  type PublicMenu,
  formatTimeLabel,
  minMenuPrice,
  publicFetch,
} from '@/lib/public-api'
import { FALLBACK_HOURS, FALLBACK_REVIEWS } from '@/lib/public-fallback'
import { won } from '@/lib/dashboard-ui'

const SLUG = 'sparkling'

type Step = 'menu' | 'datetime' | 'info' | 'done'

function nextDays(count = 14): { iso: string; label: string; weekday: string }[] {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return Array.from({ length: count }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return {
      iso,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      weekday: days[d.getDay()],
    }
  })
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={12} fill={i < n ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}

export default function SparklingPage() {
  const [business, setBusiness] = useState<PublicBusiness | null>(null)
  const [menus, setMenus] = useState<PublicMenu[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  const [bookingOpen, setBookingOpen] = useState(false)
  const [step, setStep] = useState<Step>('menu')
  const [selectedMenu, setSelectedMenu] = useState<PublicMenu | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedTime, setSelectedTime] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState<PublicBookingResult | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const dates = useMemo(() => nextDays(), [])
  const brandColor = business?.brand_color ?? '#1A6DFF'

  useEffect(() => {
    Promise.all([
      publicFetch<PublicBusiness>(`/public/${SLUG}`),
      publicFetch<PublicMenu[]>(`/public/${SLUG}/menus`),
    ])
      .then(([b, m]) => {
        setBusiness(b)
        setMenus(m)
      })
      .catch((e: Error) => setLoadError(e.message))
  }, [])

  const loadSlots = useCallback(async (menuId: string, date: string) => {
    setSlotsLoading(true)
    setSelectedTime('')
    try {
      const data = await publicFetch<AvailableSlot[]>(
        `/public/${SLUG}/available-slots?menu_id=${menuId}&booking_date=${date}`,
      )
      setSlots(data.filter((s) => s.available))
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [])

  function openBooking(menu?: PublicMenu) {
    setStep('menu')
    setSelectedMenu(menu ?? null)
    setSelectedDate(dates[0]?.iso ?? '')
    setSelectedTime('')
    setCustomerName('')
    setCustomerPhone('')
    setVehicleModel('')
    setBookingResult(null)
    setFormError(null)
    setBookingOpen(true)
  }

  function closeBooking() {
    setBookingOpen(false)
  }

  async function handleDateSelect(date: string) {
    setSelectedDate(date)
    if (selectedMenu) await loadSlots(selectedMenu.id, date)
  }

  async function handleMenuSelect(menu: PublicMenu) {
    setSelectedMenu(menu)
    const date = selectedDate || dates[0]?.iso || ''
    setSelectedDate(date)
    if (date) await loadSlots(menu.id, date)
    setStep('datetime')
  }

  async function submitBooking() {
    if (!selectedMenu || !selectedDate || !selectedTime) return
    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('이름과 연락처를 입력해주세요.')
      return
    }
    setFormError(null)
    setSubmitting(true)
    try {
      const startTime = selectedTime.length === 5 ? `${selectedTime}:00` : selectedTime
      const result = await publicFetch<PublicBookingResult>('/public/bookings', {
        method: 'POST',
        body: JSON.stringify({
          slug: SLUG,
          menu_id: selectedMenu.id,
          booking_date: selectedDate,
          start_time: startTime,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          vehicle_model: vehicleModel.trim() || null,
        }),
      })
      setBookingResult(result)
      setStep('done')
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '예약에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError && !business) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-6 text-center">
        <div>
          <p className="text-gray-500 mb-4">매장 정보를 불러오지 못했습니다.</p>
          <p className="text-sm text-gray-400">{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Banner */}
      <div
        className="relative h-48 sm:h-56 bg-gradient-to-br from-blue-600 to-blue-800"
        style={business?.banner_image_url ? {
          backgroundImage: `url(${business.banner_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : { background: `linear-gradient(135deg, ${brandColor}, #0f172a)` }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full max-w-lg mx-auto px-4 flex flex-col justify-end pb-5">
          <p className="text-white/80 text-xs mb-1">WashOn 예약</p>
          <h1 className="text-2xl font-bold text-white">{business?.name ?? '반짝반짝 손세차'}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 relative z-10 pb-28 space-y-4">
        {/* Store info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400" />
            <span>{business?.address ?? '주소 불러오는 중...'}</span>
          </div>
          {business?.phone && (
            <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm text-blue-600">
              <Phone size={16} />
              {business.phone}
            </a>
          )}
        </div>

        {/* Menus */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">세차 메뉴</h2>
          <div className="space-y-2">
            {menus.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => openBooking(m)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 transition-colors"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{m.name}</span>
                      {m.is_popular && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">인기</span>
                      )}
                    </div>
                    {m.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{m.description}</p>}
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={12} /> {m.duration_minutes}분
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-blue-600">{won(minMenuPrice(m))}~</p>
                  </div>
                </div>
              </button>
            ))}
            {!menus.length && !loadError && (
              <p className="text-sm text-gray-400 text-center py-6">메뉴를 불러오는 중...</p>
            )}
          </div>
        </section>

        {/* Hours */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">영업시간</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <ul className="space-y-2">
              {FALLBACK_HOURS.map((h) => (
                <li key={h.label} className="flex justify-between text-sm">
                  <span className="text-gray-500 w-6">{h.label}</span>
                  <span className={h.closed ? 'text-gray-400' : 'text-gray-900'}>{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Reviews */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">리뷰</h2>
          <div className="space-y-2">
            {FALLBACK_REVIEWS.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
                <Stars n={r.rating} />
                <p className="text-sm text-gray-600 mt-2">{r.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
        <div className="max-w-lg mx-auto">
          <Button
            size="lg"
            className="w-full shadow-lg"
            style={{ backgroundColor: brandColor }}
            onClick={() => openBooking()}
          >
            예약하기
          </Button>
        </div>
      </div>

      {/* Booking sheet */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeBooking} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl max-h-[92dvh] overflow-hidden flex flex-col w-full sm:max-w-lg sm:mx-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
              {step !== 'menu' && step !== 'done' && (
                <button
                  type="button"
                  onClick={() => setStep(step === 'info' ? 'datetime' : 'menu')}
                  className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-500"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <h3 className="flex-1 font-semibold text-center pr-8">
                {step === 'menu' && '메뉴 선택'}
                {step === 'datetime' && '날짜 · 시간'}
                {step === 'info' && '예약 정보'}
                {step === 'done' && '예약 완료'}
              </h3>
              <button type="button" onClick={closeBooking} className="absolute right-4 p-1.5 text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {step === 'menu' && (
                <div className="space-y-2">
                  {menus.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleMenuSelect(m)}
                      className={`w-full text-left p-4 rounded-xl border ${
                        selectedMenu?.id === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-blue-600 mt-1">{won(minMenuPrice(m))}~ · {m.duration_minutes}분</p>
                    </button>
                  ))}
                </div>
              )}

              {step === 'datetime' && selectedMenu && (
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-xl p-3 text-sm">
                    <span className="font-medium">{selectedMenu.name}</span>
                    <span className="text-gray-400"> · {selectedMenu.duration_minutes}분</span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
                      <Calendar size={14} /> 날짜 선택
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {dates.map((d) => (
                        <button
                          key={d.iso}
                          type="button"
                          onClick={() => handleDateSelect(d.iso)}
                          className={`shrink-0 px-3 py-2 rounded-xl border text-center min-w-[56px] ${
                            selectedDate === d.iso
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-200 text-gray-700'
                          }`}
                        >
                          <p className="text-[10px] opacity-80">{d.weekday}</p>
                          <p className="text-sm font-medium">{d.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
                      <Clock size={14} /> 시간 선택
                    </p>
                    {slotsLoading ? (
                      <p className="text-sm text-gray-400 py-4 text-center">시간대 불러오는 중...</p>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">예약 가능한 시간이 없습니다.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.map((s) => {
                          const t = formatTimeLabel(s.start_time)
                          return (
                            <button
                              key={s.start_time}
                              type="button"
                              onClick={() => setSelectedTime(s.start_time)}
                              className={`py-2 rounded-xl text-sm border ${
                                selectedTime === s.start_time
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              {t}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 'info' && selectedMenu && (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-3 text-sm space-y-1">
                    <p><span className="text-gray-500">메뉴</span> {selectedMenu.name}</p>
                    <p><span className="text-gray-500">일시</span> {selectedDate} {formatTimeLabel(selectedTime)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">이름 *</label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="홍길동" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">연락처 *</label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      type="tel"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">차종</label>
                    <Input
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="예: 현대 아반떼"
                    />
                  </div>
                  {formError && <p className="text-sm text-red-600">{formError}</p>}
                </div>
              )}

              {step === 'done' && bookingResult && (
                <div className="text-center py-6 space-y-4">
                  <div className="text-5xl">✅</div>
                  <h4 className="text-xl font-bold">예약이 완료됐어요!</h4>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-2">
                    <p><span className="text-gray-400">예약번호</span> {bookingResult.id.slice(0, 8).toUpperCase()}</p>
                    <p><span className="text-gray-400">일시</span> {bookingResult.booking_date} {formatTimeLabel(bookingResult.start_time)}</p>
                    <p><span className="text-gray-400">금액</span> {won(bookingResult.price)}</p>
                  </div>
                  <p className="text-sm text-gray-500">방문 전 연락처로 안내 문자를 보내드릴게요.</p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            {step !== 'done' && (
              <div className="p-4 border-t border-gray-100 shrink-0">
                {step === 'datetime' && (
                  <Button
                    className="w-full"
                    style={{ backgroundColor: brandColor }}
                    disabled={!selectedTime}
                    onClick={() => setStep('info')}
                  >
                    다음
                  </Button>
                )}
                {step === 'info' && (
                  <Button
                    className="w-full"
                    style={{ backgroundColor: brandColor }}
                    disabled={submitting}
                    onClick={submitBooking}
                  >
                    {submitting ? '예약 중...' : '예약 확정'}
                  </Button>
                )}
              </div>
            )}
            {step === 'done' && (
              <div className="p-4 border-t border-gray-100 shrink-0">
                <Button className="w-full" variant="secondary" onClick={closeBooking}>
                  닫기
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
