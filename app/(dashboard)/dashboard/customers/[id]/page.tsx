'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useCustomerDetail } from '@/lib/hooks/useCustomers'
import { useCoupons, useCustomerCoupons } from '@/lib/hooks/useCoupons'
import { CARD, won, BTN_PRIMARY } from '@/lib/dashboard-ui'
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_STYLE,
  CUSTOMER_COUPON_STATUS_LABEL,
  CUSTOMER_COUPON_STATUS_STYLE,
  CUSTOMER_GRADE_LABEL,
  CUSTOMER_GRADE_STYLE,
} from '@/constants'
import type { BookingStatus, CustomerGrade } from '@/types'

const STATUS_MAP: Record<string, BookingStatus> = {
  pending: 'pending',
  waiting: 'waiting',
  confirmed: 'confirmed',
  arrived: 'arrived',
  in_progress: 'in_progress',
  completed: 'completed',
  paid: 'paid',
  reviewed: 'reviewed',
  cancelled: 'cancelled',
  noshow: 'noshow',
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { detail, loading, error, isLive, refetch } = useCustomerDetail(id)
  const { coupons, isLive: couponsLive } = useCoupons()
  const {
    items: customerCoupons,
    loading: couponsLoading,
    isLive: customerCouponsLive,
    issue,
    markUsed,
    refetch: refetchCoupons,
  } = useCustomerCoupons(id)
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [selectedCouponId, setSelectedCouponId] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)

  if (loading) return <p className="text-sm text-gray-400">불러오는 중...</p>
  if (error || !detail) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">고객 정보를 불러올 수 없습니다.</p>
        <button type="button" className={BTN_PRIMARY} onClick={() => void refetch()}>
          다시 시도
        </button>
      </div>
    )
  }

  const visitCount = detail.visit_count
  const grade: CustomerGrade = visitCount >= 10 ? 'VIP' : visitCount >= 3 ? 'GOLD' : 'NORMAL'

  const issuableCoupons = coupons.filter((c) => {
    if (!c.is_active) return false
    const today = new Date().toISOString().slice(0, 10)
    return c.valid_from <= today && c.valid_until >= today
  })

  async function handleIssueCoupon() {
    if (!selectedCouponId) {
      setCouponMessage('쿠폰을 선택해주세요.')
      return
    }
    setIssuing(true)
    setCouponMessage(null)
    const ok = await issue(selectedCouponId)
    setIssuing(false)
    if (ok) {
      setIssueModalOpen(false)
      setSelectedCouponId('')
      setCouponMessage(null)
    } else {
      setCouponMessage('발급에 실패했습니다. 활성 쿠폰인지 확인해주세요.')
    }
  }

  async function handleUseCoupon(customerCouponId: string) {
    setCouponMessage(null)
    const ok = await markUsed(customerCouponId)
    setCouponMessage(ok ? '사용 처리되었습니다.' : '사용 처리에 실패했습니다.')
    if (ok) await refetchCoupons()
  }

  function formatCouponDiscount(type: string, value: number) {
    return type === 'amount' ? won(value) : `${value}%`
  }

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <ChevronLeft size={16} /> 고객 목록
      </Link>

      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">{detail.name}</h2>
        <Badge className={CUSTOMER_GRADE_STYLE[grade]}>{CUSTOMER_GRADE_LABEL[grade]}</Badge>
        {!isLive ? <span className="text-xs text-amber-600">데모</span> : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={CARD}>
          <p className="text-[12px] text-gray-400">방문 횟수 (완료)</p>
          <p className="text-lg font-semibold mt-1">{detail.visit_count}회</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400">누적 금액</p>
          <p className="text-lg font-semibold mt-1">{won(detail.total_spent)}</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400">차량</p>
          <p className="text-sm font-medium mt-1">{detail.vehicle_model ?? '-'}</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400">마지막 방문</p>
          <p className="text-sm font-medium mt-1">
            {detail.last_visit_at
              ? new Date(detail.last_visit_at).toLocaleString('ko-KR')
              : '-'}
          </p>
        </div>
      </div>

      <div className={CARD}>
        <p className="text-sm font-semibold text-gray-900 mb-3">고객 정보</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">이름</span>
            <span className="font-medium text-gray-900">{detail.name ?? '-'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">연락처</span>
            <span className="font-medium text-gray-900">{detail.phone ?? '-'}</span>
          </div>
          {detail.email ? (
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">이메일</span>
              <span className="font-medium text-gray-900">{detail.email}</span>
            </div>
          ) : null}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          이름·연락처는 플랫폼 회원 정보이며 사장님이 수정할 수 없습니다.
          업체별 메모/태그 저장은 준비 중입니다.
        </p>
      </div>

      {(detail.vehicles?.length ?? 0) > 0 ? (
        <div className={CARD}>
          <p className="text-sm font-semibold text-gray-900 mb-3">차량</p>
          <div className="space-y-2">
            {detail.vehicles!.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">
                  {v.licensePlate}
                  {v.isPrimary ? (
                    <span className="ml-2 text-[11px] text-blue-600">대표</span>
                  ) : null}
                </span>
                <span className="text-gray-500">
                  {[v.brand, v.model].filter(Boolean).join(' ') || '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(detail.upcomingReservations?.length ?? 0) > 0 ? (
        <div className={CARD}>
          <p className="text-sm font-semibold text-gray-900 mb-3">예정 예약</p>
          <div className="space-y-2">
            {detail.upcomingReservations!.map((row) => (
              <div
                key={row.booking_id}
                className="flex items-center justify-between gap-2 text-sm border-b border-gray-50 pb-2"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {row.booking_date} {row.start_time.slice(0, 5)}
                  </p>
                  <p className="text-xs text-gray-500">{row.menu_name ?? '-'}</p>
                </div>
                <span className="text-xs text-gray-500">{row.vehicle_model ?? '-'}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className={CARD}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-sm font-semibold text-gray-900">보유 쿠폰</p>
          <button
            type="button"
            disabled={!isLive || !couponsLive || !customerCouponsLive}
            onClick={() => {
              setCouponMessage(null)
              setSelectedCouponId(issuableCoupons[0]?.id ?? '')
              setIssueModalOpen(true)
            }}
            className="text-xs text-blue-600 font-medium flex items-center gap-1 disabled:opacity-50"
          >
            <Plus size={14} /> 쿠폰 발급
          </button>
        </div>
        {couponsLoading ? <p className="text-xs text-gray-400">불러오는 중...</p> : null}
        {couponMessage ? <p className="text-xs text-gray-500 mb-2">{couponMessage}</p> : null}
        {customerCoupons.length === 0 && !couponsLoading ? (
          <p className="text-sm text-gray-400">보유 쿠폰이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {customerCoupons.map((cc) => (
              <div key={cc.id} className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{cc.coupon_name}</span>
                    <Badge className={CUSTOMER_COUPON_STATUS_STYLE[cc.status] ?? 'bg-gray-100 text-gray-600'}>
                      {CUSTOMER_COUPON_STATUS_LABEL[cc.status] ?? cc.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatCouponDiscount(cc.discount_type, cc.discount_value)} · {cc.valid_from} ~ {cc.valid_until}
                  </p>
                </div>
                {cc.status === 'issued' && customerCouponsLive ? (
                  <button
                    type="button"
                    onClick={() => void handleUseCoupon(cc.id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 shrink-0"
                  >
                    사용 처리
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={issueModalOpen} title="쿠폰 발급" onClose={() => setIssueModalOpen(false)}>
        <div className="space-y-3">
          {issuableCoupons.length === 0 ? (
            <p className="text-sm text-gray-500">발급 가능한 활성 쿠폰이 없습니다.</p>
          ) : (
            <select
              value={selectedCouponId}
              onChange={(e) => setSelectedCouponId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {issuableCoupons.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.discount_type === 'amount' ? won(c.discount_value) : `${c.discount_value}%`})
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            disabled={issuing || issuableCoupons.length === 0}
            onClick={() => void handleIssueCoupon()}
            className={`${BTN_PRIMARY} w-full py-2.5 disabled:opacity-50`}
          >
            {issuing ? '발급 중...' : '발급'}
          </button>
        </div>
      </Modal>

      <div className={CARD}>
        <p className="text-sm font-semibold text-gray-900 mb-3">예약 이력</p>
        {detail.visit_history.length === 0 ? (
          <p className="text-sm text-gray-400">예약 이력이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-2">예약번호</th>
                  <th className="py-2 pr-2">일시</th>
                  <th className="py-2 pr-2">메뉴</th>
                  <th className="py-2 pr-2">차량</th>
                  <th className="py-2 pr-2">상태</th>
                  <th className="py-2 text-right">금액</th>
                </tr>
              </thead>
              <tbody>
                {detail.visit_history.map((row) => {
                  const uiStatus = STATUS_MAP[row.status.toLowerCase()] ?? 'pending'
                  return (
                    <tr key={row.booking_id} className="border-b border-gray-50">
                      <td className="py-2 pr-2">
                        <Link
                          href={`/bookings/${row.booking_id}?date=${row.booking_date}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          {row.booking_number}
                        </Link>
                      </td>
                      <td className="py-2 pr-2 text-xs text-gray-600 whitespace-nowrap">
                        {row.booking_date} {row.start_time.slice(0, 5)}
                      </td>
                      <td className="py-2 pr-2 text-xs">{row.menu_name}</td>
                      <td className="py-2 pr-2 text-xs text-gray-500">{row.vehicle_model ?? '-'}</td>
                      <td className="py-2 pr-2">
                        <Badge className={BOOKING_STATUS_STYLE[uiStatus]}>
                          {BOOKING_STATUS_LABEL[uiStatus]}
                        </Badge>
                      </td>
                      <td className="py-2 text-right font-medium">{won(row.price)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={CARD}>
        <p className="text-sm font-semibold text-gray-900 mb-3">리뷰</p>
        {(detail.reviews?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-400">등록된 리뷰가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {detail.reviews!.map((rv) => (
              <div key={rv.id} className="border-b border-gray-50 pb-2 last:border-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-amber-600">{rv.rating}점</span>
                  <span className="text-xs text-gray-400">
                    {rv.createdAt
                      ? new Date(rv.createdAt).toLocaleDateString('ko-KR')
                      : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{rv.content ?? '-'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
