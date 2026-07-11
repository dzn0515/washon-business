const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export async function publicFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail ?? `API error: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export type PublicGalleryImage = {
  id: string
  image_url: string
  caption: string
  sort_order: number
}

export type PublicBusiness = {
  id: string
  name: string
  slug: string
  address: string
  phone: string | null
  logo_url: string | null
  banner_image_url: string | null
  brand_color: string
  lat: number | null
  lng: number | null
  gallery_images?: PublicGalleryImage[]
}

export type PublicMenu = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  is_popular: boolean
  prices: { vehicle_size: string; vehicle_origin: string; price: number }[]
}

export type AvailableSlot = {
  start_time: string
  end_time: string
  available: boolean
}

export type PublicBookingResult = {
  id: string
  booking_date: string
  start_time: string
  customer_name: string
  price: number
  status: string
}

export function minMenuPrice(menu: PublicMenu): number {
  if (!menu.prices.length) return 0
  return Math.min(...menu.prices.map((p) => p.price))
}

export function formatTimeLabel(isoTime: string): string {
  return isoTime.slice(0, 5)
}
