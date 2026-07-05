import type { AdBillingType } from '@/lib/billing/catalog'

export type AdApplicationStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'ended'

export type AdApplicationProductType = 'exposure' | 'ad' | 'automation'

export type AdminAdApplication = {
  id: string
  businessId: string
  businessName: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  productId: string
  productName: string
  productType: AdApplicationProductType
  billingType: AdBillingType
  amount: number
  appliedAt: string
  status: AdApplicationStatus
  startDate: string | null
  endDate: string | null
  applicationMemo: string
  adminMemo: string
  rejectReason?: string
}

export const AD_APPLICATION_STATUS_LABEL: Record<AdApplicationStatus, string> = {
  pending: '신청대기',
  approved: '승인',
  rejected: '반려',
  active: '진행중',
  ended: '종료',
}

export const AD_APPLICATION_PRODUCT_TYPE_LABEL: Record<AdApplicationProductType, string> = {
  exposure: '노출확장',
  ad: '광고상품',
  automation: '자동화',
}

export const mockAdminAdApplications: AdminAdApplication[] = [
  {
    id: 'adapp-001',
    businessId: 'biz-101',
    businessName: '클린카워시 강남점',
    ownerName: '김민수',
    ownerPhone: '010-1234-5678',
    ownerEmail: 'minsu@cleanwash.kr',
    productId: 'exposure-10km',
    productName: '반경 10km',
    productType: 'exposure',
    billingType: 'monthly',
    amount: 15000,
    appliedAt: '2026-07-05',
    status: 'pending',
    startDate: null,
    endDate: null,
    applicationMemo: '강남권 신규 고객 유입을 위해 노출 반경 확장 희망합니다.',
    adminMemo: '',
  },
  {
    id: 'adapp-002',
    businessId: 'biz-102',
    businessName: '프리미엄 디테일링',
    ownerName: '이지영',
    ownerPhone: '010-2345-6789',
    ownerEmail: 'jiyoung@premium.kr',
    productId: 'ad-search-top',
    productName: '검색 상단 고정',
    productType: 'ad',
    billingType: 'one_time',
    amount: 50000,
    appliedAt: '2026-07-04',
    status: 'pending',
    startDate: null,
    endDate: null,
    applicationMemo: '7월 프로모션 기간 검색 상단 노출 신청합니다.',
    adminMemo: '',
  },
  {
    id: 'adapp-003',
    businessId: 'biz-103',
    businessName: '스피드세차 송파',
    ownerName: '박준호',
    ownerPhone: '010-3456-7890',
    ownerEmail: 'junho@speed.kr',
    productId: 'auto-bundle',
    productName: '자동화 전체',
    productType: 'automation',
    billingType: 'monthly',
    amount: 15000,
    appliedAt: '2026-07-03',
    status: 'approved',
    startDate: '2026-07-10',
    endDate: '2026-10-10',
    applicationMemo: '재방문율 개선을 위해 자동화 전체 패키지 신청.',
    adminMemo: '7/10 시작 예정. 카카오 알림톡 템플릿 확인 필요.',
  },
  {
    id: 'adapp-004',
    businessId: 'biz-104',
    businessName: '타이어프로 마포',
    ownerName: '최수진',
    ownerPhone: '010-4567-8901',
    ownerEmail: 'sujin@tirepro.kr',
    productId: 'ad-main-banner',
    productName: '앱 메인 배너',
    productType: 'ad',
    billingType: 'one_time',
    amount: 80000,
    appliedAt: '2026-07-01',
    status: 'active',
    startDate: '2026-07-01',
    endDate: '2026-07-04',
    applicationMemo: '여름 타이어 교체 시즌 메인 배너 3일 노출.',
    adminMemo: '배너 소재 확인 완료.',
  },
  {
    id: 'adapp-005',
    businessId: 'biz-105',
    businessName: '오토케어 분당',
    ownerName: '정하늘',
    ownerPhone: '010-5678-9012',
    ownerEmail: 'haneul@autocare.kr',
    productId: 'exposure-nation',
    productName: '전국 노출',
    productType: 'exposure',
    billingType: 'monthly',
    amount: 50000,
    appliedAt: '2026-06-20',
    status: 'active',
    startDate: '2026-06-25',
    endDate: '2026-09-25',
    applicationMemo: '프랜차이즈 확장으로 전국 노출 필요.',
    adminMemo: '분당 본점 기준 전국 노출 적용.',
  },
  {
    id: 'adapp-006',
    businessId: 'biz-106',
    businessName: '샤인카wash',
    ownerName: '한동욱',
    ownerPhone: '010-6789-0123',
    ownerEmail: 'dongwook@shine.kr',
    productId: 'ad-push',
    productName: '푸시 알림 발송',
    productType: 'ad',
    billingType: 'one_time',
    amount: 30000,
    appliedAt: '2026-06-15',
    status: 'ended',
    startDate: '2026-06-18',
    endDate: '2026-06-18',
    applicationMemo: '6월 할인 이벤트 푸시 1회 발송.',
    adminMemo: '발송 완료. 클릭률 2.1%.',
  },
  {
    id: 'adapp-007',
    businessId: 'biz-107',
    businessName: '카케어스테이션',
    ownerName: '윤서연',
    ownerPhone: '010-7890-1234',
    ownerEmail: 'seoyeon@carcare.kr',
    productId: 'auto-revisit',
    productName: '재방문 알림',
    productType: 'automation',
    billingType: 'monthly',
    amount: 5000,
    appliedAt: '2026-07-02',
    status: 'rejected',
    startDate: null,
    endDate: null,
    applicationMemo: '미방문 고객 대상 재방문 알림 자동 발송.',
    adminMemo: 'Basic 플랜 한도 초과.',
    rejectReason: '현재 Basic 플랜에서는 자동화 기능 신청이 제한됩니다. Standard 이상으로 변경 후 재신청해 주세요.',
  },
  {
    id: 'adapp-008',
    businessId: 'biz-108',
    businessName: '디테일링하우스',
    ownerName: '강태민',
    ownerPhone: '010-8901-2345',
    ownerEmail: 'taemin@detail.kr',
    productId: 'exposure-20km',
    productName: '반경 20km',
    productType: 'exposure',
    billingType: 'monthly',
    amount: 30000,
    appliedAt: '2026-07-05',
    status: 'pending',
    startDate: null,
    endDate: null,
    applicationMemo: '인천·부천 지역까지 노출 확장 요청.',
    adminMemo: '',
  },
]
