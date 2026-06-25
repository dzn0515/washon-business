'use client'
import useSWR from 'swr'
import { mockApi } from '@/lib/mock/data'

export function useCustomers() {
  return useSWR('customers', () => mockApi.getCustomers())
}

export function useCustomer(id: number) {
  return useSWR(id ? ['customer', id] : null, () => mockApi.getCustomer(id))
}
