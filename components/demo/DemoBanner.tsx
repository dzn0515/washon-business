export default function DemoBanner() {
  return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
      <div className="max-w-5xl mx-auto">
        <p className="text-sm font-semibold text-blue-900">AUTOON Business Demo</p>
        <p className="text-xs font-medium text-blue-800 mt-0.5">사장님 PC 프로그램 미리보기</p>
        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
          예약부터 고객관리, 차량관리, 직원관리, 매출관리까지 한 화면에서 둘러보세요.
          모든 화면은 데모이며 데이터는 저장되지 않습니다.
        </p>
      </div>
    </div>
  )
}
