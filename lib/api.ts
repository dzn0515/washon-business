import axios from 'axios'
import { getToken } from '@/lib/auth'
import { clearAuthSession } from '@/lib/api-client'
import { isDemoMode } from '@/lib/demo-mode'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (isDemoMode()) {
    return Promise.reject(new Error('Demo mode: API calls are disabled'))
  }
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined' && !isDemoMode()) {
      clearAuthSession()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false'

export {
  updateBookingStatus,
  getStoreVehicles,
  getVehicleRecords,
  createVehicleRecord,
  getMenusGrouped,
  updateMenuCategory,
  fetchBusinessMe,
} from '@/lib/store-api'

export type { GroupedMenuItem, VehicleRecordCreatePayload, BusinessMe } from '@/lib/store-api'

