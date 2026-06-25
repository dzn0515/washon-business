import { redirect } from 'next/navigation'

export default function SettlementsRedirect() {
  redirect('/dashboard/revenue')
}
