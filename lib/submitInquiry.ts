export interface InquiryData {
  bizName: string
  ownerName: string
  phone: string
  region: string
  address?: string
  message?: string
  privacyAgreed: boolean
}

export async function submitInquiry(data: InquiryData): Promise<void> {
  // TODO: API 연결 시 fetch('https://api.autoon.kr/api/v1/inquiries', {...}) 로 교체
  console.log('[AUTOON 입점문의]', data)
  await new Promise((r) => setTimeout(r, 800))
}
