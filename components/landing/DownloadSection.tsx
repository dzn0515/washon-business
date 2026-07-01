export default function DownloadSection() {
  return (
    <section className="py-16 md:py-24 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">AUTOON 사장님 프로그램</h2>
        <p className="mt-4 text-lg text-gray-600">PC에 설치하고 바탕화면에서 바로 실행하세요.</p>
        <a
          href="/releases/AUTOON_Setup.exe"
          className="inline-block mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
        >
          Windows 다운로드 (.exe)
        </a>
        {/* TODO: 실제 빌드 파일 autoon.kr/releases/ 경로에 업로드 필요 */}
        <p className="mt-6 text-sm text-gray-500">
          Windows 10 / 11 지원 · 설치 후 로그인하여 사용
          <br />
          버전 업데이트는 프로그램 실행 시 자동으로 적용됩니다.
        </p>
      </div>
    </section>
  )
}
