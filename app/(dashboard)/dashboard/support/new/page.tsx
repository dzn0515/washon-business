'use client'

import SupportTicketCreateForm from '@/components/support/SupportTicketCreateForm'

export default function OwnerSupportNewPage() {
  return <SupportTicketCreateForm ticketsBasePath="/dashboard/support/tickets" />
}
