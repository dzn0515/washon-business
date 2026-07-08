'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { BUSINESS_TYPES, getBusinessTypeLabel, type BusinessTypeCode } from '@/lib/business-types'
import { formatResourceCountLabel, formatResourceCountOption } from '@/lib/resource-label'
import { register, type RegisterPayload } from '@/lib/api-client'
import { composeStoreAddress, openDaumPostcode } from '@/lib/postcode'

const STEPS = ['계정 정보', '매장 정보', '사업자 정보']

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
  const [zipcode, setZipcode] = useState('')
  const [roadAddress, setRoadAddress] = useState('')
  const [jibunAddress, setJibunAddress] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const [bayCount, setBayCount] = useState(1)

  const [businessNumber, setBusinessNumber] = useState('')
  const [bizType, setBizType] = useState<BusinessTypeCode>(BUSINESS_TYPES[0].code)
  const [phone, setPhone] = useState('')

  const openAddressSearch = async () => {
    setError(null)
    try {
      await openDaumPostcode((data) => {
        setZipcode(data.zonecode)
        setRoadAddress(data.roadAddress)
        setJibunAddress(data.jibunAddress)
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '주소 검색을 시작하지 못했습니다.')
    }
  }

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
      if (!businessName || !phoneBusiness) {
        setError('매장 정보를 입력해주세요.')
        return
      }
      if (!roadAddress) {
        setError('주소 검색을 통해 도로명주소를 입력해주세요.')
        return
      }
      if (!detailAddress.trim()) {
        setError('상세주소를 입력해주세요.')
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
        const address = composeStoreAddress(roadAddress, detailAddress)
        const payload: RegisterPayload = {
          email,
          password,
          name,
          phone,
          business_name: businessName,
          biz_type: bizType,
          business_number: businessNumber,
          address,
          zipcode,
          road_address: roadAddress,
          jibun_address: jibunAddress,
          detail_address: detailAddress.trim(),
          phone_business: phoneBusiness,
          bay_count: bayCount,
          business_category: getBusinessTypeLabel(bizType),
        }
        await register(payload)
        router.push('/pending')
      } catch (e) {
        setError(e instanceof Error ? e.message : '가입에 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
  }

  const prev = () => step > 0 && setStep(step - 1)

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="max-w-md mx-auto p-4 pb-8">
        <div className="text-center pt-6 mb-6">
          <div className="text-3xl mb-2">💧</div>
          <h1 className="text-xl font-bold text-gray-900">AUTOON</h1>
          <p className="text-sm text-gray-500 mt-1">세차장 사장님 가입</p>
        </div>

        <div className="flex gap-1 mb-6">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1 rounded-full ${i <= step ? 'bg-[#1A6DFF]' : 'bg-gray-200'}`} />
              <p className={`text-[10px] mt-1 text-center ${i === step ? 'text-[#1A6DFF] font-medium' : 'text-gray-400'}`}>
                {label}
              </p>
            </div>
          ))}
        </div>

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

              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">우편번호</label>
                    <Input value={zipcode} readOnly placeholder="주소 검색 시 자동 입력" />
                  </div>
                  <Button type="button" variant="secondary" className="shrink-0" onClick={() => void openAddressSearch()}>
                    <Search size={16} className="mr-1" />
                    주소 검색
                  </Button>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">도로명주소</label>
                  <Input value={roadAddress} readOnly placeholder="주소 검색 시 자동 입력" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">지번주소</label>
                  <Input value={jibunAddress} readOnly placeholder="주소 검색 시 자동 입력" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">상세주소</label>
                  <Input
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    placeholder="101호, 2층 등"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">업종</label>
                <select
                  value={bizType}
                  onChange={(e) => setBizType(e.target.value as BusinessTypeCode)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                >
                  {BUSINESS_TYPES.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{formatResourceCountLabel(bizType)}</label>
                <select
                  value={bayCount}
                  onChange={(e) => setBayCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{formatResourceCountOption(n, bizType)}</option>
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
                <label className="text-xs text-gray-500 mb-1 block">휴대폰 번호</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

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
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-[#1A6DFF] font-medium">로그인</Link>
        </p>
      </div>
    </div>
  )
}
