import { mockBusiness, mockBusinessHours, mockCoupons, mockMenus } from '@/lib/mock/data'
import type { StoreAppProfile } from '@/types/store-app'

function formatHours(): string {
  const open = mockBusinessHours.filter((h) => h.is_open)
  if (open.length === 0) return '09:00~18:00'
  const weekdays = open.filter((h) => h.day >= 1 && h.day <= 5)
  const sat = open.find((h) => h.day === 6)
  const parts: string[] = []
  if (weekdays.length) {
    parts.push(`월~금 ${weekdays[0].open_time}~${weekdays[0].close_time}`)
  }
  if (sat) parts.push(`토 ${sat.open_time}~${sat.close_time}`)
  return parts.join(', ') || '09:00~19:00'
}

function couponDiscountLabel(type: 'FIXED' | 'PERCENT', value: number): string {
  return type === 'FIXED' ? `${value.toLocaleString()}원` : `${value}% OFF`
}

export function createDefaultStoreAppProfile(): StoreAppProfile {
  const { store } = {
    store: {
      id: String(mockBusiness.id),
      name: mockBusiness.name,
      slug: mockBusiness.slug,
      description: mockBusiness.description,
      phone: mockBusiness.phone,
      address: mockBusiness.address,
      hours: formatHours(),
      brandColor: mockBusiness.primary_color,
      logoUrl: mockBusiness.logo_url ?? '',
      bannerUrl: mockBusiness.banner_url ?? '',
    },
  }

  return {
    store,
    services: mockMenus.map((m) => ({
      id: String(m.id),
      name: m.name,
      description: m.description,
      durationMinutes: m.duration_minutes,
      price: m.base_price,
      isVisible: m.is_active,
    })),
    coupons: mockCoupons.map((c) => ({
      id: String(c.id),
      name: c.name,
      discountType: c.discount_type,
      discountValue: c.discount_value,
      validFrom: c.valid_from,
      validUntil: c.valid_until,
      description: `${couponDiscountLabel(c.discount_type, c.discount_value)} · 최소 ${c.min_price.toLocaleString()}원`,
      isVisible: c.is_active,
    })),
    events: [
      {
        id: '1',
        title: '여름맞이 광택 패키지',
        description: '외부 세차 + 광택 코팅을 한 번에! 한정 수량 운영 중입니다.',
        period: '2026.06.01 ~ 2026.08.31',
        isVisible: true,
      },
      {
        id: '2',
        title: '친구 추천 이벤트',
        description: '친구와 함께 방문하면 두 분 모두 5,000원 할인 쿠폰을 드려요.',
        period: '2026.06.15 ~ 2026.07.15',
        isVisible: true,
      },
      {
        id: '3',
        title: '리뷰 작성 감사 이벤트',
        description: '방문 후 리뷰를 남기시면 다음 방문 시 음료 쿠폰을 드립니다.',
        period: '상시 진행',
        isVisible: false,
      },
    ],
  }
}
