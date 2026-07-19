export const metadata = {
  title: '회사 소개 | AUTOON',
  description: 'AUTOON은 차량 관리 매장의 예약·CRM·재방문 운영을 돕는 B2B SaaS + 예약 플랫폼입니다.',
}

const CURRENT_SERVICES = [
  { icon: '🚿', name: '세차' },
  { icon: '🔨', name: '덴트·복원' },
  { icon: '🔧', name: '타이어' },
  { icon: '✨', name: '디테일링' },
  { icon: '🔋', name: '배터리' },
  { icon: '🪟', name: '유리·선팅' },
  { icon: '📱', name: '블박·네비' },
  { icon: '🛢️', name: '오일·정비' },
]

const ROADMAP = [
  {
    status: '✅ 현재 서비스',
    content: (
      <div className="flex flex-wrap gap-2 mt-2">
        {CURRENT_SERVICES.map((s) => (
          <span
            key={s.name}
            className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm inline-flex items-center gap-1"
          >
            <span>{s.icon}</span>
            {s.name}
          </span>
        ))}
      </div>
    ),
  },
  {
    status: '🔜 확장 예정',
    content: (
      <p className="mt-2 text-gray-800">카오디오 전문점 · PPF · 경정비 전문점</p>
    ),
  },
  {
    status: '🎯 최종 목표',
    content: (
      <p className="mt-2 text-gray-800">자동차 생활 서비스 종합 플랫폼</p>
    ),
  },
]

export default function AboutPage() {
  return (
    <>
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">차량 관리 서비스를 연결합니다</h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            AUTOON은 세차·타이어·썬팅·디테일링·덴트 등 차량 관리 매장의 예약·CRM·재방문 운영을 돕는
            B2B SaaS + 예약 플랫폼입니다.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">서비스 로드맵</h2>
          <div className="space-y-8">
            {ROADMAP.map((item, i) => (
              <div key={item.status} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                  {i < ROADMAP.length - 1 ? <div className="w-0.5 flex-1 bg-gray-200 mt-2 min-h-[40px]" /> : null}
                </div>
                <div className="pb-2 flex-1">
                  <span className="text-sm font-medium text-blue-600">{item.status}</span>
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <p className="text-sm text-gray-500">운영사</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">Sellem Inc.</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <p className="text-sm text-gray-500">도메인</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">autoon.kr / autoon.com</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
