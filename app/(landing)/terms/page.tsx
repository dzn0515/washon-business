export const metadata = {
  title: '이용약관 | AUTOON',
  description: 'AUTOON 서비스 이용약관',
}

export default function TermsPage() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">이용약관</h1>
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">제1조 목적</h2>
            <p>AUTOON 서비스 이용 조건 정의</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">제2조 서비스 제공자</h2>
            <p>Sellem Inc.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">제3조 서비스 내용</h2>
            <p>자동차 서비스 예약·운영 관리 SaaS</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">제4조 이용 계약</h2>
            <p>입점 신청 승인으로 계약 성립</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">제5조 서비스 변경 및 중단</h2>
            <p>사전 고지 후 변경 또는 중단 가능</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">제6조 분쟁 해결</h2>
            <p>대한민국 법률 준수</p>
          </div>
        </div>
      </div>
    </section>
  )
}
