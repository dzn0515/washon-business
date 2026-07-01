'use client'

import BookingReminderPopup from '@/components/features/bookings/BookingReminderPopup'
import { useBookingReminders } from '@/lib/booking-reminder/useBookingReminders'

export default function BookingReminderHost() {
  const { activeAlert, dismissAlert } = useBookingReminders()

  if (!activeAlert) return null

  return <BookingReminderPopup alert={activeAlert} onDismiss={dismissAlert} />
}
