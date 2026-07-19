const INCLUDED = [
  { title: 'Basic · Standard', detail: '기본 500m 노출 포함' },
  { title: 'Premium', detail: '1.5km 거리 노출 포함 · 별도 신청 없음' },
]

const PRODUCTS = [
  { name: '지역 노출 1km', radius: '1km', price: '15,000원' },
  { name: '지역 노출 1.5km', radius: '1.5km', price: '30,000원' },
  { name: '지역 노출 3km', radius: '3km', price: '50,000원' },
  { name: '10km Premium', radius: '10km', price: '100,000원', premium: true },
]

export default function AdExposureSection() {
  return (
    <section id="ads" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">거리 기반 광고·노출</h2>
          <p className="mt-4 text-lg text-gray-600">
            구독 플랜 포함 노출과 별도 광고상품을 함께 사용할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {INCLUDED.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-blue-100 bg-blue-50/60 px-6 py-5"
            >
              <p className="font-semibold text-gray-900">{item.title}</p>
              <p className="mt-1 text-sm text-gray-700">{item.detail}</p>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">추가 구매 상품</h3>
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">상품</th>
                <th className="px-4 py-3 font-medium">거리</th>
                <th className="px-4 py-3 font-medium">월 요금</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p) => (
                <tr key={p.name} className="border-t border-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {p.name}
                    {p.premium ? (
                      <span className="ml-2 text-xs font-semibold text-teal-700">Premium 배지</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.radius}</td>
                  <td className="px-4 py-3 text-gray-900">{p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-6 space-y-2 text-sm text-gray-600">
          <li>· 10km Premium만 홈 추천 후보 · 우선 노출 · Premium 배지 혜택이 적용됩니다.</li>
          <li>· Premium 구독 플랜 이름만으로 Premium 배지가 붙지 않습니다.</li>
          <li>· 광고는 고객 위치와 매장 좌표가 있을 때, 설정 반경 내 추천·광고 후보로 노출됩니다.</li>
          <li>· 전국 노출 상품은 운영하지 않습니다. 모든 요금은 VAT 별도입니다.</li>
        </ul>
      </div>
    </section>
  )
}
