import { apiFetch } from '@/lib/api-client'

export type RevisitReminderSettings = {
  business_id: string
  enabled: boolean
  interval_days: number
  include_coupon: boolean
  use_default_message: boolean
  custom_message: string | null
  allowed_interval_days: number[]
  updated_at: string | null
  last_run_at: string | null
  sent_total: number
  failed_total: number
  preview_message: string | null
}

export type RevisitReminderSettingsPayload = {
  enabled: boolean
  interval_days: number
  include_coupon?: boolean
  use_default_message?: boolean
  custom_message?: string | null
}

export async function fetchRevisitReminderSettings() {
  return apiFetch<RevisitReminderSettings>('/business/revisit-reminder/settings')
}

export async function saveRevisitReminderSettings(data: RevisitReminderSettingsPayload) {
  return apiFetch<RevisitReminderSettings>('/business/revisit-reminder/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
