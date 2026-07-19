const INDUSTRIES = [
  '세차',
  '광택·디테일링',
  '타이어',
  '썬팅',
  '블랙박스·내비게이션',
  '덴트·외형복원',
  '엔진오일·경정비',
  '배터리·유리복원',
]

export default function IndustriesSection() {
  return (
    <section id="industries" className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">다양한 차량 관리 업종을 지원합니다</h2>
          <p className="mt-4 text-lg text-gray-600">
            AUTOON은 세차장 전용 서비스가 아닙니다. 자동차 서비스 매장이라면 입점할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {INDUSTRIES.map((name) => (
            <span
              key={name}
              className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
