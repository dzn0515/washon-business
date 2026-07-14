import { apiFetch } from '@/lib/api-client'

export type ReviewRewardSettings = {
  enabled: boolean
  couponTemplateId: number | null
  couponTemplateName: string | null
  updatedAt: string | null
}

export type ReviewRewardSettingsPayload = {
  enabled: boolean
  couponTemplateId: number | null
}

export type ReviewRewardTemplate = {
  id: string
  name: string
  discountType: string
  discountValue: number
  validFrom: string
  validUntil: string
  isActive: boolean
}

export async function fetchReviewRewardSettings() {
  return apiFetch<ReviewRewardSettings>('/business/review-reward')
}

export async function saveReviewRewardSettings(data: ReviewRewardSettingsPayload) {
  return apiFetch<ReviewRewardSettings>('/business/review-reward', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function fetchReviewRewardTemplates() {
  return apiFetch<{ items: ReviewRewardTemplate[] }>('/business/review-reward/templates')
}
