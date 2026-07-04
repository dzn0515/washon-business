'use client'

import { useRouter } from 'next/navigation'
import AdminBreadcrumb from './AdminBreadcrumb'
import { useAdmin } from '@/context/AdminContext'
import { clearAuthSession } from '@/lib/api-client'

export default function AdminHeader() {
  const router = useRouter()
  const { theme, toggleTheme, adminUser, setAdminUser } = useAdmin()

  const handleLogout = () => {
    clearAuthSession()
    setAdminUser(null)
    router.push('/admin/login')
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-6">
      <AdminBreadcrumb />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="text-gray-400 hover:text-gray-600 text-sm"
          title={theme === 'light' ? '다크 모드' : '라이트 모드'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
          최고관리자
        </span>
        <span className="text-sm text-gray-700 font-medium">
          {adminUser?.email ?? 'admin'}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
