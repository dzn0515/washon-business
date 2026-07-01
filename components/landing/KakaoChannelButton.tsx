// TODO: 실제 카카오톡 채널 URL로 교체
const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_YOUR_CHANNEL'

export default function KakaoChannelButton({ label = '카카오톡으로 빠르게 문의하기' }: { label?: string }) {
  return (
    <a
      href={KAKAO_CHANNEL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-[#FEE500] text-[#3C1E1E] font-semibold px-6 py-3 rounded-xl hover:bg-[#F0D800] transition-colors"
    >
      <span>💬</span>
      {label}
    </a>
  )
}
