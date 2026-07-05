export default function DemoBanner() {
  return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 shrink-0">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-sm font-semibold text-blue-900">AUTOON Business Demo</p>
        <p className="text-xs text-blue-700">읽기 전용 · 데이터는 저장되지 않습니다.</p>
      </div>
    </div>
  )
}
