import axios from 'axios'
import { getToken, clearToken } from '@/lib/auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      clearToken()
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

