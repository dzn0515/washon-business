'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { SERVICE_TYPE_LABEL } from '@/constants'
import type { ServiceTypeCode } from '@/types'

const STEPS = ['기본 정보', '서비스 타입', '영업시간', '브랜드']
const SERVICE_TYPES = Object.keys(SERVICE_TYPE_LABEL) as ServiceTypeCode[]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [selected, setSelected] = useState<ServiceTypeCode[]>(['CAR_WASH'])
  const [color, setColor] = useState('#1E40AF')

  const next = () => step < 3 ? setStep(step + 1) : router.push('/dashboard')
  const prev = () => step > 0 && setStep(step - 1)

  return (
    <div className="min-h-[100dvh] bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-lg font-bold text-gray-900 mb-1">업체 등록</h1>
        <div className="flex gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-primary-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 0 && (
          <Card title="Step 1 — 기본 정보">
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500 mb-1 block">매장명</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="반짝반짝 손세차" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">전화번호</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="033-123-4567" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">주소</label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소 검색 (카카오 API 연동 예정)" /></div>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card title="Step 2 — 서비스 타입">
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map((code) => (
                <button
                  key={code}
                  onClick={() => setSelected((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code])}
                  className={`px-3 py-1.5 rounded-full text-xs border ${selected.includes(code) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  {SERVICE_TYPE_LABEL[code]}
                </button>
              ))}
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card title="Step 3 — 영업시간">
            <p className="text-sm text-gray-500">월~금 09:00–19:00, 토 09:00–18:00, 일 휴무 (기본값)</p>
            <p className="text-xs text-gray-400 mt-2">등록 후 설정에서 상세 수정 가능합니다.</p>
          </Card>
        )}

        {step === 3 && (
          <Card title="Step 4 — 브랜드">
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500 mb-1 block">대표 컬러</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg border-0" />
                  <Input value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-gray-400">로고/배너 업로드는 등록 후 브랜드 설정에서 가능합니다.</p>
            </div>
          </Card>
        )}

        <div className="flex gap-2 mt-4">
          {step > 0 && <Button variant="secondary" className="flex-1" onClick={prev}>이전</Button>}
          <Button className="flex-[2]" onClick={next}>{step === 3 ? '등록 완료' : '다음'}</Button>
        </div>
      </div>
    </div>
  )
}
