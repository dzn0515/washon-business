'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react'
import { sendAlimtalk } from '@/lib/alimtalk'

type Step = 1 | 2 | 3 | 4 | 5
type PaymentMethod = 'toss' | 'card' | 'onsite'

const STORE_NAME = '반짝반짝 손세차'

const menus = [
  {
    id: '1',
    name: '기본 외부 세차',
    description: '외관 전체 거품세차 + 물기제거',
    duration: 40,
    isPopular: true,
    basePrice: 20000,
  },
  {
    id: '2',
    name: '실내+외부 풀세차',
    description: '외부 세차 + 실내 진공청소',
    duration: 90,
    isPopular: false,
    basePrice: 45000,
  },
  {
    id: '3',
    name: '유리막 코팅',
    description: '발수 유리막 코팅 · 3~6개월 지속',
    duration: 120,
    isPopular: false,
    basePrice: 80000,
  },
  {
    id: '4',
    name: '엔진룸 세척',
    description: '엔진룸 고압 스팀 세척',
    duration: 60,
    isPopular: false,
    basePrice: 35000,
  },
]

const slots = [
  { time: '09:00', available: true, bays: 2 },
  { time: '10:00', available: true, bays: 1 },
  { time: '11:00', available: false, bays: 0 },
  { time: '12:00', available: true, bays: 3 },
  { time: '13:00', available: true, bays: 2 },
  { time: '14:00', available: false, bays: 0 },
  { time: '15:00', available: true, bays: 1 },
  { time: '16:00', available: true, bays: 2 },
  { time: '17:00', available: false, bays: 0 },
  { time: '18:00', available: true, bays: 1 },
  { time: '19:00', available: true, bays: 2 },
]

const CLOSED_DAYS = [5, 12, 19, 26]
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const STEP_LABELS = ['메뉴', '날짜', '시간', '결제'] as const
const STEP_TITLES: Record<Step, string> = {
  1: '메뉴 선택',
  2: '날짜 선택',
  3: '시간 선택',
  4: '결제하기',
  5: '예약 완료',
}

const PAYMENT_OPTIONS: {
  id: PaymentMethod
  name: string
  desc: string
  dotClass: string
}[] = [
  { id: 'toss', name: '토스페이', desc: '간편 결제', dotClass: 'bg-[#1A6DFF]' },
  { id: 'card', name: '신용카드', desc: '카드 결제', dotClass: 'bg-gray-400' },
  { id: 'onsite', name: '현장결제', desc: '방문 후 결제', dotClass: 'bg-gray-400' },
]

function formatPrice(amount: number) {
  return `${amount.toLocaleString()}원`
}

function formatDateLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function BookingPage() {
  const router = useRouter()

  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const [step, setStep] = useState<Step>(1)
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('toss')
  const [requestNote, setRequestNote] = useState('')

  const selectedMenu = menus.find((m) => m.id === selectedMenuId) ?? null

  const calendarCells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate()
    const startPad = first.getDay()
    const cells: (number | null)[] = Array(startPad).fill(null)
    for (let d = 1; d <= lastDay; d++) cells.push(d)
    return cells
  }, [viewYear, viewMonth])

  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate())

  function isPastDay(day: number) {
    const iso = toIso(viewYear, viewMonth, day)
    return iso < todayIso
  }

  function isClosedDay(day: number) {
    return CLOSED_DAYS.includes(day)
  }

  function handleBack() {
    if (step === 1) router.back()
    else setStep((s) => (s - 1) as Step)
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else setViewMonth((m) => m + 1)
  }

  function selectDay(day: number) {
    if (isPastDay(day) || isClosedDay(day)) return
    setSelectedDate(toIso(viewYear, viewMonth, day))
  }

  async function handleConfirm() {
    if (!selectedMenu || !selectedDate || !selectedTime) return
    await sendAlimtalk({
      customerName: '고객',
      customerPhone: '010-0000-0000',
      storeName: STORE_NAME,
      menuName: selectedMenu.name,
      bookingDate: selectedDate,
      bookingTime: selectedTime,
      price: selectedMenu.basePrice,
    })
    setStep(5)
  }

  const canNext =
    (step === 1 && selectedMenuId) ||
    (step === 2 && selectedDate) ||
    (step === 3 && selectedTime)

  const showBottomNext = step >= 1 && step <= 3
  const showBottomConfirm = step === 4

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-28">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <button
          type="button"
          onClick={handleBack}
          className="p-1 -ml-1 text-gray-700"
          aria-label="뒤로"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-[15px] font-medium text-gray-900">{STEP_TITLES[step]}</span>
        <div className="w-5" />
      </div>

      {/* 스텝 인디케이터 */}
      {step >= 1 && step <= 4 && (
        <div className="flex items-center px-4 py-3 gap-0">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1
            const done = step > n
            const current = step === n
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center shrink-0">
                  <div
                    className={`w-[22px] h-[22px] rounded-full flex items-center justify-center ${
                      done || current
                        ? 'bg-[#1A6DFF] text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {done ? (
                      <Check className="text-white" size={12} />
                    ) : (
                      <span className="text-[11px] font-medium">{n}</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] ml-1 ${
                      current ? 'text-[#1A6DFF] font-medium' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-1 ${step > n ? 'bg-[#1A6DFF]' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div className="pt-4">
          <p className="text-[13px] font-medium text-gray-500 px-4 mb-3">예약할 메뉴를 선택하세요</p>
          {menus.map((menu) => {
            const selected = selectedMenuId === menu.id
            return (
              <button
                key={menu.id}
                type="button"
                onClick={() => setSelectedMenuId(menu.id)}
                className={`w-[calc(100%-2rem)] border rounded-xl p-3 mx-4 mb-2 cursor-pointer text-left ${
                  selected ? 'border-[#1A6DFF] bg-blue-50' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-medium text-gray-900">{menu.name}</span>
                      {menu.isPopular && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                          인기
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-500 mt-0.5">{menu.description}</p>
                    <p className="text-[11px] text-gray-400 mt-1">약 {menu.duration}분</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`text-[15px] font-medium ${
                        selected ? 'text-[#1A6DFF]' : 'text-gray-900'
                      }`}
                    >
                      {formatPrice(menu.basePrice)}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selected ? 'bg-[#1A6DFF] border-[#1A6DFF]' : 'border-gray-300'
                      }`}
                    >
                      {selected && <Check className="text-white" size={12} />}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && selectedMenu && (
        <div className="pt-4">
          <MenuSummaryCard
            menu={selectedMenu}
            onChange={() => setStep(1)}
          />
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className="p-1 text-gray-600">
                <ChevronLeft size={20} />
              </button>
              <span className="text-[14px] font-medium text-gray-900">
                {viewYear}년 {viewMonth + 1}월
              </span>
              <button type="button" onClick={nextMonth} className="p-1 text-gray-600">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-[11px] text-gray-400 text-center py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-[3px]">
              {calendarCells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} />
                const iso = toIso(viewYear, viewMonth, day)
                const past = isPastDay(day)
                const closed = isClosedDay(day)
                const isToday = iso === todayIso
                const isSelected = selectedDate === iso
                const available = !past && !closed
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={past || closed}
                    onClick={() => selectDay(day)}
                    className={`h-[34px] flex items-center justify-center rounded-lg text-[13px] relative ${
                      isSelected
                        ? 'bg-[#1A6DFF] text-white font-medium'
                        : past
                          ? 'text-gray-300 cursor-default'
                          : isToday
                            ? 'border border-[#1A6DFF] text-[#1A6DFF] cursor-pointer'
                            : 'cursor-pointer text-gray-900'
                    }`}
                  >
                    {day}
                    {available && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-green-500 absolute bottom-1" />
                    )}
                    {closed && !past && (
                      <span className="w-1 h-1 rounded-full bg-red-400 absolute bottom-1" />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-3 mt-3">
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                예약 가능
              </span>
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                마감
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && selectedMenu && selectedDate && (
        <div className="pt-4">
          <MenuDateSummaryCard
            menu={selectedMenu}
            dateLabel={formatDateLabel(selectedDate)}
            onChangeMenu={() => setStep(1)}
            onChangeDate={() => setStep(2)}
          />
          <div className="px-4">
            <p className="text-[13px] font-medium text-gray-900 mb-3">시간을 선택하세요</p>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => {
                const selected = selectedTime === slot.time
                const disabled = !slot.available
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`p-2.5 rounded-xl text-center border ${
                      disabled
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100'
                        : selected
                          ? 'bg-[#1A6DFF] text-white border-[#1A6DFF] font-medium'
                          : 'border-gray-200 cursor-pointer'
                    }`}
                  >
                    <p className="text-[13px]">{slot.time}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        disabled
                          ? 'text-gray-400'
                          : selected
                            ? 'text-white/80'
                            : 'text-green-600'
                      }`}
                    >
                      {disabled ? '마감' : `베이 ${slot.bays}개`}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && selectedMenu && selectedDate && selectedTime && (
        <div className="pt-4">
          <div className="px-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <SummaryRow label="매장" value={STORE_NAME} />
              <SummaryRow label="메뉴" value={selectedMenu.name} />
              <SummaryRow
                label="일시"
                value={`${formatDateLabel(selectedDate)} ${selectedTime}`}
              />
              <SummaryRow
                label="결제금액"
                value={formatPrice(selectedMenu.basePrice)}
                highlight
              />
            </div>
          </div>

          <div className="px-4 mb-4">
            <p className="text-[13px] font-medium text-gray-900 mb-2">결제 수단</p>
            {PAYMENT_OPTIONS.map((opt) => {
              const selected = selectedPayment === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedPayment(opt.id)}
                  className={`w-full border rounded-xl p-3 mb-2 flex items-center gap-3 cursor-pointer text-left ${
                    selected ? 'border-[#1A6DFF] bg-blue-50' : 'border-gray-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${opt.dotClass} shrink-0`} />
                  <div>
                    <p className="text-[14px] font-medium text-gray-900">{opt.name}</p>
                    <p className="text-[12px] text-gray-500">{opt.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="px-4 mb-4">
            <p className="text-[13px] font-medium text-gray-900 mb-2">요청사항</p>
            <textarea
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="사장님께 전달할 내용을 적어주세요 (선택)"
              rows={3}
              className="border border-gray-200 rounded-xl p-3 text-[13px] w-full resize-none outline-none focus:border-[#1A6DFF] focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      )}

      {/* Step 5 */}
      {step === 5 && selectedMenu && selectedDate && selectedTime && (
        <div className="flex flex-col items-center px-4 pt-10 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="text-[#1A6DFF]" size={32} />
          </div>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">예약이 완료됐어요!</h2>
          <p className="text-[13px] text-gray-500">📱 예약 확인 알림톡이 발송됐어요.</p>
          <p className="text-[13px] text-gray-500 mb-6">⏰ 방문 1시간 전 리마인더도 보내드려요.</p>

          <div className="w-full bg-gray-50 rounded-2xl p-4 mb-6 text-left">
            <SummaryRow label="매장" value={STORE_NAME} />
            <SummaryRow label="메뉴" value={selectedMenu.name} />
            <SummaryRow
              label="일시"
              value={`${formatDateLabel(selectedDate)} ${selectedTime}`}
            />
            <SummaryRow label="결제" value={formatPrice(selectedMenu.basePrice)} />
            <SummaryRow
              label="결제수단"
              value={PAYMENT_OPTIONS.find((p) => p.id === selectedPayment)?.name ?? ''}
            />
          </div>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full h-12 bg-[#1A6DFF] text-white rounded-xl font-medium text-[14px]"
          >
            예약 내역 보기 →
          </button>
        </div>
      )}

      {/* 하단 [다음] */}
      {showBottomNext && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-20">
          <div className="max-w-md mx-auto">
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => (s + 1) as Step)}
              className={`w-full h-12 rounded-xl text-[14px] font-medium ${
                canNext
                  ? 'bg-[#1A6DFF] text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* 하단 [예약 확정] */}
      {showBottomConfirm && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-20">
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full h-12 bg-[#1A6DFF] text-white rounded-xl text-[14px] font-medium flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              예약 확정하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between text-[13px] py-1.5 border-b border-gray-100 last:border-0 gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span
        className={`font-medium text-right ${
          highlight ? 'text-[#1A6DFF] text-[15px]' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function MenuSummaryCard({
  menu,
  onChange,
}: {
  menu: (typeof menus)[0]
  onChange: () => void
}) {
  return (
    <div className="px-4 mb-4">
      <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-gray-900 truncate">{menu.name}</p>
          <p className="text-[12px] text-gray-500">약 {menu.duration}분</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[14px] font-medium text-gray-900">
            {formatPrice(menu.basePrice)}
          </span>
          <button
            type="button"
            onClick={onChange}
            className="text-[#1A6DFF] text-[12px] font-medium"
          >
            변경
          </button>
        </div>
      </div>
    </div>
  )
}

function MenuDateSummaryCard({
  menu,
  dateLabel,
  onChangeMenu,
  onChangeDate,
}: {
  menu: (typeof menus)[0]
  dateLabel: string
  onChangeMenu: () => void
  onChangeDate: () => void
}) {
  return (
    <div className="px-4 mb-4">
      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
        <div className="flex justify-between items-center gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-gray-900 truncate">{menu.name}</p>
            <p className="text-[12px] text-gray-500">약 {menu.duration}분</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[14px] font-medium text-gray-900">
              {formatPrice(menu.basePrice)}
            </span>
            <button
              type="button"
              onClick={onChangeMenu}
              className="text-[#1A6DFF] text-[12px] font-medium"
            >
              변경
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <p className="text-[13px] text-gray-700">{dateLabel}</p>
          <button
            type="button"
            onClick={onChangeDate}
            className="text-[#1A6DFF] text-[12px] font-medium"
          >
            변경
          </button>
        </div>
      </div>
    </div>
  )
}
