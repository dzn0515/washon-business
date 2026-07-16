import { register, type RegisterPayload } from '@/lib/api-client'

export interface InquiryData {
  email: string
  password: string
  bizName: string
  ownerName: string
  phone: string
  region: string
  address?: string
  bizType: string
  message?: string
  privacyAgreed: boolean
}

function composeAddress(data: InquiryData): string {
  const parts = [data.region.trim(), (data.address || '').trim()].filter(Boolean)
  const base = parts.join(' ')
  const note = (data.message || '').trim()
  if (!note) return base
  if (!base) return `문의: ${note}`
  return `${base} (문의: ${note})`
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

  if (!email || !password || !businessName || !ownerName || !phone || !bizType) {
    throw new Error('필수 항목을 입력해 주세요.')
  }
  if (password.length < 6) {
    throw new Error('비밀번호는 6자 이상이어야 합니다.')
  }

  const payload: RegisterPayload = {
    email,
    password,
    name: ownerName,
    phone,
    business_name: businessName,
    biz_type: bizType,
    business_number: undefined,
    address: composeAddress(data),
    phone_business: phone,
    bay_count: 1,
  }

  return register(payload)
}
