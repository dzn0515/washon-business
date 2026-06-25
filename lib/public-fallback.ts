/** Public API에 hours/reviews 엔드포인트가 없을 때 MVP fallback */

export const FALLBACK_HOURS = [
  { label: '월', time: '09:00 - 19:00', closed: false },
  { label: '화', time: '09:00 - 19:00', closed: false },
  { label: '수', time: '09:00 - 19:00', closed: false },
  { label: '목', time: '09:00 - 19:00', closed: false },
  { label: '금', time: '09:00 - 19:00', closed: false },
  { label: '토', time: '09:00 - 18:00', closed: false },
  { label: '일', time: '휴무', closed: true },
] as const

export const FALLBACK_REVIEWS = [
  { id: 1, name: '김**', rating: 5, content: '실내까지 깔끔하게 해주셔서 만족합니다. 다음에도 올게요!', date: '2026.06.18' },
  { id: 2, name: '이**', rating: 5, content: '예약하고 가니 대기 없이 바로 받을 수 있어서 좋았어요.', date: '2026.06.12' },
  { id: 3, name: '박**', rating: 4, content: '가격 대비 퀄리티 최고입니다. 주변에 추천했어요.', date: '2026.06.05' },
] as const
