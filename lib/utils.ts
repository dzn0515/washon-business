import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatMoney(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function formatPhone(phone: string) {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
}
