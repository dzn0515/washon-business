'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { register, type RegisterPayload } from '@/lib/api-client'

const STEPS = ['계정 정보', '매장 정보', '사업자 정보', '완료']
const CATEGORIES = ['손세차', '자동세차', '디테일링', '기타']

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')

  const [businessName, setBusinessName] = useState('')
  const [phoneBusiness, setPhoneBusiness] = useState('')
  const [address, setAddress] = useState('')
  const [bayCount, setBayCount] = useState(1)

  const [businessNumber, setBusinessNumber] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [phone, setPhone] = useState('')

  const next = async () => {
    setError(null)
    if (step === 0) {
      if (!email || !password || !name) {
        setError('필수 항목을 입력해주세요.')
        return
      }
      if (password !== passwordConfirm) {
        setError('비밀번호가 일치하지 않습니다.')
        return
      }
      setStep(1)
      return
    }
    if (step === 1) {
      if (!businessName || !phoneBusiness || !address) {
        setError('매장 정보를 입력해주세요.')
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      if (!businessNumber || !phone) {
        setError('사업자 정보를 입력해주세요.')
        return
      }
      setLoading(true)
      try {
        const payload: RegisterPayload = {
          email,
          password,
          name,
          phone,
          business_name: businessName,
          business_number: businessNumber,
          address,
          phone_business: phoneBusiness,
          bay_count: bayCount,
          business_category: category,
        }
        await register(payload)
        setStep(3)
      } catch (e) {
        setError(e instanceof Error ? e.message : '가입에 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
  }

  const prev = () => step > 0 && step < 3 && setStep(step - 1)

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="max-w-md mx-auto p-4 pb-8">
        <div className="text-center pt-6 mb-6">
          <div className="text-3xl mb-2">💧</div>
          <h1 className="text-xl font-bold text-gray-900">WashOn</h1>
          <p className="text-sm text-gray-500 mt-1">세차장 사장님 가입</p>
        </div>

        {step < 3 && (
          <div className="flex gap-1 mb-6">
            {STEPS.slice(0, 3).map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1 rounded-full ${i <= step ? 'bg-[#1A6DFF]' : 'bg-gray-200'}`} />
                <p className={`text-[10px] mt-1 text-center ${i === step ? 'text-[#1A6DFF] font-medium' : 'text-gray-400'}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          {step === 0 && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">이메일</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">비밀번호</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">비밀번호 확인</label>
                <Input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">이름</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="김사장" />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">매장 이름</label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="반짝반짝 손세차" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">대표 전화번호</label>
                <Input value={phoneBusiness} onChange={(e) => setPhoneBusiness(e.target.value)} placeholder="033-123-4567" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">주소</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="강원도 원주시 무실로 42" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">베이 수</label>
                <select
                  value={bayCount}
                  onChange={(e) => setBayCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}베이</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">사업자등록번호</label>
                <Input
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(formatBusinessNumber(e.target.value))}
                  placeholder="000-00-00000"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">업종</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">휴대폰 번호</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-4 space-y-3">
              <div className="text-4xl">✅</div>
              <h2 className="text-lg font-semibold">가입 신청이 완료됐습니다!</h2>
              <p className="text-sm text-gray-500">관리자 검토 후 1~2 영업일 내 승인됩니다.</p>
              <p className="text-sm text-gray-500">승인 완료 시 알림톡으로 안내드립니다.</p>
              <Button className="w-full mt-4" onClick={() => router.push('/login')}>
                로그인 화면으로
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {step < 3 && (
            <div className="flex gap-2 pt-2">
              {step > 0 && (
                <Button variant="secondary" className="flex-1" onClick={prev}>
                  <ChevronLeft size={16} className="mr-1" /> 이전
                </Button>
              )}
              <Button className="flex-[2]" onClick={next} disabled={loading}>
                {loading ? '신청 중...' : step === 2 ? '가입 신청' : '다음'}
              </Button>
            </div>
          )}
        </div>

        {step < 3 && (
          <p className="text-center text-sm text-gray-500 mt-6">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-[#1A6DFF] font-medium">로그인</Link>
          </p>
        )}
      </div>
    </div>
  )
}
