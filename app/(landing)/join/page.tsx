import InquiryForm from '@/components/landing/InquiryForm'

const TARGETS = [
  { icon: '🚿', title: '세차', desc: '손세차장 · 자동세차장 · 셀프세차장' },
  { icon: '🔨', title: '덴트·복원', desc: '덴트복원샵 · 판금도색' },
  { icon: '🔧', title: '타이어', desc: '타이어샵 · 얼라이먼트' },
  { icon: '✨', title: '디테일링', desc: '디테일링샵 · 광택 · 유리막 · 실내크리닝' },
  { icon: '🔋', title: '배터리', desc: '배터리 교체 전문점 · 출장 배터리' },
  { icon: '🪟', title: '유리·선팅', desc: '앞유리 복원·교체 · 선팅 · 랩핑' },
  { icon: '📱', title: '블박·네비', desc: '블랙박스 · 네비게이션 · 카오디오' },
  { icon: '🛢️', title: '오일·정비', desc: '오일교환 전문점 · 경정비 · 카센터' },
]

const FEATURES = [
  '온라인 예약: 실시간 슬롯 선택, 날짜·시간 예약',
  '슬롯 관리: 베이별 예약 현황, 이중 예약 원천 차단',
  '베이·직원 자동배정',
  '고객 CRM: 방문이력, 단골태그, 고객 메모',
  '쿠폰 관리: 발급·사용 내역',
  '매출 관리: 일별·월별 정산 자동화',
  '알림: 카카오 알림톡, 앱 푸시',
]

const STEPS = ['문의 접수', '담당자 상담', '매장 등록', '메뉴/가격 설정', '예약 오픈']

export const metadata = {
  title: '입점 안내 | AUTOON',
  description: '자동차 서비스 업체 입점 안내. 매장 정보를 남겨주시면 담당자가 확인 후 연락드립니다.',
}

export default function JoinPage() {
  return (
    <>
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">어떤 매장이 입점할 수 있나요?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TARGETS.map((t) => (
              <div
                key={t.title}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center"
              >
                <span className="text-3xl">{t.icon}</span>
                <p className="mt-3 text-sm font-semibold text-gray-900">{t.title}</p>
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-gray-600">
            위 업종 외 자동차 관련 서비스 업체도 입점 가능합니다. 문의해 주세요.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            입점하면 이런 기능을 사용할 수 있습니다
          </h2>
          <ul className="max-w-2xl mx-auto space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-600 shrink-0">✅</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">간단한 5단계로 시작합니다</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <div key={step} className="flex flex-col md:flex-row items-center gap-2 flex-1">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mx-auto">
                    {i + 1}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">{step}</p>
                </div>
                {i < STEPS.length - 1 ? (
                  <span className="hidden md:block text-gray-300 flex-1 text-center">→</span>
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-gray-600">
            요금제는 매장 규모에 따라 상담 후 안내드립니다.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">입점 신청</h2>
          <p className="text-center text-sm text-gray-500 mb-10 max-w-xl mx-auto">
            신청이 접수되면 관리자 승인대기 목록에 등록됩니다. 승인 후 바로 로그인해 매장을 운영할 수
            있습니다.
          </p>
          <InquiryForm />
        </div>
      </section>
    </>
  )
}
