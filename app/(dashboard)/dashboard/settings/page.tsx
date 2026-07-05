'use client'
import { useRouter } from 'next/navigation'
import BookingReminderSettingsPanel from '@/components/features/bookings/BookingReminderSettingsPanel'
import { CARD } from '@/lib/dashboard-ui'
import { useAuthStore } from '@/store/auth'
import { LogOut } from 'lucide-react'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import { useBusinessMe } from '@/lib/hooks/useBusinessMe'
import { getUserEmail } from '@/lib/api-client'

export default function SettingsPage() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const { isDemo } = useDemoMode()
  const { display, loading, error } = useBusinessMe()
  const userEmail = getUserEmail()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-600 text-white rounded-xl p-5">
        <p className="text-sm opacity-80">현재 플랜</p>
        <p className="text-xl font-bold mt-1">{isDemo ? 'Standard' : '기본 노출'}</p>
        <p className="text-sm mt-3 opacity-90">
          {isDemo ? '첫 1개월 무료 체험 중 · 2026.07.24 종료' : '3개월 무료 체험 중 · 2026.09.24 종료'}
        </p>
        <div className="mt-4 pt-4 border-t border-white/20 text-sm">
          <p>{isDemo ? '다음 결제 2026.07.24' : '다음 결제 2026.09.24'}</p>
          <p className="mt-1 font-medium">
            {isDemo ? 'AUTOON Business 이용료 59,000원/월' : '앱 노출 유지비 28,000원/월'}
          </p>
        </div>
      </div>

      <div className={CARD}>
        <p className="text-[12px] text-gray-400 font-medium mb-3">매장 정보</p>
        {loading ? (
          <p className="text-sm text-gray-400">매장 정보를 불러오는 중…</p>
        ) : error || !display ? (
          <p className="text-sm text-gray-500">매장 정보를 불러올 수 없습니다.</p>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">매장명</span>
              <span className="font-medium">{display.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">연락처</span>
              <span className="font-medium">{display.phone || '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400 shrink-0">주소</span>
              <span className="font-medium text-right">{display.address || '—'}</span>
            </div>
          </div>
        )}
        <button
          type="button"
          disabled={isDemo}
          className="w-full mt-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          매장 정보 수정
        </button>
      </div>

      <BookingReminderSettingsPanel />

      <div className={CARD}>
        <p className="text-[12px] text-gray-400 font-medium mb-3">알림 설정</p>
        <div className="space-y-3">
          {[
            { label: '새 예약 알림', on: true },
            { label: '예약 취소 알림', on: true },
            { label: '정산 완료 알림', on: true },
            { label: '리뷰 등록 알림', on: false },
          ].map((item) => (
            <label key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{item.label}</span>
              <input type="checkbox" defaultChecked={item.on} className="rounded text-blue-600" />
            </label>
          ))}
        </div>
      </div>

      <div className={CARD}>
        <p className="text-[12px] text-gray-400 font-medium mb-3">예약 설정</p>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">예약 간격</span>
            <select className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
              <option>30분</option>
              <option>60분</option>
            </select>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">당일 예약 허용</span>
            <input type="checkbox" defaultChecked className="rounded text-blue-600" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">노쇼 자동 처리</span>
            <input type="checkbox" defaultChecked className="rounded text-blue-600" />
          </div>
        </div>
      </div>

      <div className={CARD}>
        <p className="text-[12px] text-gray-400 font-medium mb-3">계정</p>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">이메일</span>
            <span className="font-medium">{userEmail ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">비밀번호</span>
            <button type="button" disabled={isDemo} className="text-blue-600 font-medium disabled:opacity-50">
              변경
            </button>
          </div>
        </div>
        {!isDemo ? (
          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-50"
          >
            <LogOut size={16} /> 로그아웃
          </button>
        ) : null}
      </div>
    </div>
  )
}
