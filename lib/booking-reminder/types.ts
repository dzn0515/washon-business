export type ReminderStage = '30min' | '10min' | 'at_time'

export type BookingReminderAlert = {
  id: string
  bookingId: string
  stage: ReminderStage
  customerName: string
  carNumber: string
  serviceName: string
  bookingTime: string
  bookingDate: string
  voiceText: string
}

export const REMINDER_STAGE_LABEL: Record<ReminderStage, string> = {
  '30min': '30분 전',
  '10min': '10분 전',
  at_time: '예약 시간',
}
