export const metadata = {
  title: '개인정보처리방침 | AUTOON',
  description: 'AUTOON 입점 문의 개인정보처리방침',
}

export default function PrivacyPage() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">개인정보처리방침</h1>
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. 수집하는 개인정보 항목</h2>
            <p>업체명, 대표자명, 연락처, 매장 주소</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. 개인정보 수집 및 이용 목적</h2>
            <p>입점 문의 처리 및 상담 연락</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. 개인정보 보유 및 이용 기간</h2>
            <p>문의 처리 완료 후 3년, 또는 동의 철회 시 즉시 파기</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. 개인정보 처리 위탁</h2>
            <p>없음</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. 정보주체의 권리</h2>
            <p>열람·수정·삭제·처리정지 요청 가능</p>
          </div>
          <div className="border-t border-gray-100 pt-6 text-sm text-gray-500">
            <p>운영사: Sellem Inc.</p>
            <p className="mt-1">문의: [추후 이메일 주소 교체]</p>
          </div>
        </div>
      </div>
    </section>
  )
}
