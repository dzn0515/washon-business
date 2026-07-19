'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, ChevronRight, MapPin, MessageCircle } from 'lucide-react'

type Step = 'popup' | 'installing' | 'homescreen'

const HOME_APPS = [
  { id: 'kakao', label: '카카오톡', bg: 'bg-[#FEE500]', icon: MessageCircle, iconClass: 'text-gray-900' },
  { id: 'autoon', label: 'AUTOON', bg: 'bg-[#1A6DFF]', emoji: '💧' },
  { id: 'naver', label: '네이버지도', bg: 'bg-[#03C75A]', icon: MapPin, iconClass: 'text-white' },
  { id: 'camera', label: '카메라', bg: 'bg-gray-200', icon: Camera, iconClass: 'text-gray-700' },
] as const

function AutoonIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'w-14 h-14 rounded-2xl text-2xl' : 'w-12 h-12 rounded-2xl text-xl'
  return (
    <div className={`${box} bg-[#1A6DFF] flex items-center justify-center shadow-md`} aria-hidden>
      💧
    </div>
  )
}

export default function InstallPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('popup')
  const [progress, setProgress] = useState(0)
  const [installDone, setInstallDone] = useState(false)

  useEffect(() => {
    if (step !== 'installing') return

    setProgress(0)
    setInstallDone(false)

    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100
        return prev + 2
      })
    }, 50)

    return () => window.clearInterval(timer)
  }, [step])

  useEffect(() => {
    if (step !== 'installing' || progress < 100) return

    setInstallDone(true)
    const doneTimer = window.setTimeout(() => setStep('homescreen'), 700)
    return () => window.clearTimeout(doneTimer)
  }, [progress, step])

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="max-w-md mx-auto min-h-[100dvh] relative">
        {/* 배경: 앱 미리보기 */}
        <div className="absolute inset-0 p-4 pt-10 opacity-40 pointer-events-none">
          <div className="bg-white rounded-2xl border p-4 space-y-3">
            <div className="h-32 rounded-xl bg-gradient-to-br from-[#1A6DFF] to-blue-900" />
            <p className="font-bold text-lg">반짝반짝 손세차</p>
            <p className="text-sm text-gray-500">프리미엄 손세차 · 1.2km</p>
            <p className="text-sm text-blue-600 font-medium">{(35000).toLocaleString()}원~</p>
          </div>
        </div>

        {step === 'popup' && (
          <div className="absolute inset-0 flex items-end sm:items-center justify-center p-4 bg-black/30">
            <div className="bg-white rounded-2xl shadow-xl border w-full p-6 space-y-5">
              <div className="flex items-center gap-3">
                <AutoonIcon />
                <div>
                  <p className="font-bold text-gray-900">AUTOON</p>
                  <p className="text-sm text-gray-500">차량 관리 예약을 더 빠르게</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                홈 화면에 추가하면 앱처럼 바로 예약할 수 있어요.
              </p>
              <button
                type="button"
                onClick={() => setStep('installing')}
                className="w-full py-3.5 rounded-xl bg-[#1A6DFF] text-white font-semibold"
              >
                홈 화면에 추가
              </button>
              <button
                type="button"
                onClick={() => router.push('/sparkling')}
                className="w-full py-2 text-gray-500 text-sm"
              >
                나중에
              </button>
            </div>
          </div>
        )}

        {step === 'installing' && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl border w-full p-8 text-center space-y-6">
              <AutoonIcon />
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {installDone ? '설치 완료!' : '설치 중...'}
                </p>
                <p className="text-sm text-gray-500 mt-1">AUTOON</p>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1A6DFF] rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{progress}%</p>
              </div>
            </div>
          </div>
        )}

        {step === 'homescreen' && (
          <div className="absolute inset-0 flex flex-col">
            {/* 스마트폰 홈 화면 */}
            <div className="flex-1 p-6 pt-14">
              <div className="rounded-[2rem] border-4 border-gray-800 bg-gradient-to-b from-indigo-400 via-purple-300 to-pink-200 shadow-2xl overflow-hidden min-h-[420px] flex flex-col">
                <div className="pt-3 pb-2 text-center text-white text-xs font-medium drop-shadow">
                  오후 2:30
                </div>
                <div className="flex-1 px-5 pt-4">
                  <div className="grid grid-cols-4 gap-4">
                    {HOME_APPS.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={app.id === 'autoon' ? () => router.push('/sparkling') : undefined}
                        className="flex flex-col items-center gap-1.5"
                      >
                        {'emoji' in app ? (
                          <div className={`w-14 h-14 rounded-2xl ${app.bg} flex items-center justify-center text-2xl shadow-md ring-2 ring-white/50`}>
                            {app.emoji}
                          </div>
                        ) : (
                          <div className={`w-14 h-14 rounded-2xl ${app.bg} flex items-center justify-center shadow-md`}>
                            <app.icon size={26} className={app.iconClass} />
                          </div>
                        )}
                        <span className="text-[10px] text-white font-medium drop-shadow text-center leading-tight">
                          {app.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-1 w-28 bg-white/80 rounded-full mx-auto mb-3" />
              </div>
            </div>

            <div className="bg-white rounded-t-3xl border-t shadow-xl p-6 space-y-4">
              <p className="text-center font-semibold text-gray-900">
                바탕화면에 AUTOON 아이콘이 추가됐어요!
              </p>
              <button
                type="button"
                onClick={() => router.push('/sparkling')}
                className="w-full flex items-center justify-center gap-1 py-3.5 rounded-xl bg-[#1A6DFF] text-white font-semibold"
              >
                AUTOON 아이콘 탭하기
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
