import { register, type RegisterPayload } from '@/lib/api-client'
import { composeStoreAddress } from '@/lib/postcode'

export interface InquiryData {
  email: string
  password: string
  bizName: string
  ownerName: string
  phone: string
  zipcode: string
  roadAddress: string
  jibunAddress: string
  detailAddress: string
  bizType: string
  /** UI-only for now: partners 테이블에 문의 메모 컬럼이 없어 저장하지 않음 */
  message?: string
  privacyAgreed: boolean
}

/**
 * Public landing “입점 신청/문의” → same path as /register:
 * POST /auth/register → partners.status=PENDING → /admin/businesses/pending
 */
export async function submitInquiry(data: InquiryData): Promise<{
  id: string
  email: string
  status: string
  message: string
}> {
  if (!data.privacyAgreed) {
    throw new Error('개인정보 수집 및 이용에 동의해 주세요.')
  }

  const email = data.email.trim()
  const password = data.password
  const businessName = data.bizName.trim()
  const ownerName = data.ownerName.trim()
  const phone = data.phone.trim()
  const bizType = data.bizType.trim()
  const zipcode = data.zipcode.trim()
  const roadAddress = data.roadAddress.trim()
  const jibunAddress = data.jibunAddress.trim()
  const detailAddress = data.detailAddress.trim()

  if (!email || !password || !businessName || !ownerName || !phone || !bizType) {
    throw new Error('필수 항목을 입력해 주세요.')
  }
  if (password.length < 6) {
    throw new Error('비밀번호는 6자 이상이어야 합니다.')
  }
  if (!roadAddress) {
    throw new Error('주소를 먼저 검색해 주세요')
  }
  if (!detailAddress) {
    throw new Error('상세주소를 입력해 주세요')
  }

  // partners.address = 도로명 + 상세만. 문의 내용은 저장 필드가 없어 합치지 않음.
  const address = composeStoreAddress(roadAddress, detailAddress)

  const payload: RegisterPayload = {
    email,
    password,
    name: ownerName,
    phone,
    business_name: businessName,
    biz_type: bizType,
    business_number: undefined,
    address,
    zipcode: zipcode || undefined,
    road_address: roadAddress,
    jibun_address: jibunAddress || undefined,
    detail_address: detailAddress,
    phone_business: phone,
    bay_count: 1,
  }

  return register(payload)
}
