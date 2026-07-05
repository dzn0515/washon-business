import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '계정 및 데이터 삭제 안내 | AUTOON',
  description: 'AUTOON(오토온) 계정 및 개인정보 삭제 요청 방법을 안내합니다.',
}

const container: React.CSSProperties = {
  maxWidth: 800,
  margin: '0 auto',
  padding: 24,
  lineHeight: 1.7,
  color: '#111827',
}

const h1: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 24,
}

const h2: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginTop: 28,
  marginBottom: 8,
}

const p: React.CSSProperties = {
  marginBottom: 12,
  fontSize: 14,
}

const ul: React.CSSProperties = {
  marginBottom: 12,
  paddingLeft: 20,
  fontSize: 14,
}

const li: React.CSSProperties = {
  marginBottom: 6,
}

export default function DeleteAccountPage() {
  return (
    <main style={container}>
      <h1 style={h1}>AUTOON 계정 및 데이터 삭제 요청 안내</h1>

      <p style={p}>
        AUTOON(오토온)을 이용해 주셔서 감사합니다. 이용자는 언제든지 AUTOON 계정 또는 저장된
        개인정보의 삭제를 요청할 수 있습니다. 본 페이지는 Google Play 정책 및 개인정보 보호
        관련 요구사항에 따라 계정·데이터 삭제 절차를 안내합니다.
      </p>

      <h2 style={h2}>1. 삭제 요청 방법</h2>
      <p style={p}>아래 이메일 주소로 삭제 요청 메일을 보내 주세요.</p>
      <p style={p}>
        <strong>이메일:</strong>{' '}
        <a href="mailto:dzn7777@gmail.com" style={{ color: '#1A6DFF' }}>
          dzn7777@gmail.com
        </a>
      </p>
      <p style={p}>메일에 다음 정보를 포함해 주시면 신속히 처리할 수 있습니다.</p>
      <ul style={ul}>
        <li style={li}>앱 이름: AUTOON</li>
        <li style={li}>가입 시 사용한 이메일 주소 또는 전화번호</li>
        <li style={li}>요청 유형: 계정 삭제 또는 일부 데이터 삭제</li>
        <li style={li}>삭제를 원하는 항목(일부 삭제 요청 시)</li>
      </ul>

      <h2 style={h2}>2. 삭제되는 데이터</h2>
      <p style={p}>계정 삭제가 완료되면 아래 데이터가 삭제되거나 복구 불가능한 상태로 처리됩니다.</p>
      <ul style={ul}>
        <li style={li}>계정 정보(로그인 정보, 인증 정보)</li>
        <li style={li}>프로필 정보(이름, 닉네임, 연락처 등)</li>
        <li style={li}>차량 정보</li>
        <li style={li}>예약 내역</li>
        <li style={li}>리뷰, 문의 등 사용자가 생성한 콘텐츠</li>
        <li style={li}>계정에 저장된 위치 관련 정보</li>
      </ul>

      <h2 style={h2}>3. 보관될 수 있는 데이터</h2>
      <p style={p}>
        아래 정보는 관계 법령, 결제·정산, 세금 처리, 분쟁 대응, 부정 이용 방지, 보안 목적상
        필요한 경우에 한해 일정 기간 보관될 수 있습니다.
      </p>
      <ul style={ul}>
        <li style={li}>결제 및 거래 기록</li>
        <li style={li}>분쟁·민원 처리에 필요한 기록</li>
        <li style={li}>법령상 의무 보관 대상 정보</li>
        <li style={li}>부정 이용 방지 및 보안을 위한 최소한의 로그</li>
      </ul>

      <h2 style={h2}>4. 처리 기간</h2>
      <p style={p}>
        삭제 요청 접수 후 본인 확인이 완료되면, 일반적으로 <strong>30일 이내</strong>에 처리
        결과를 이메일로 안내합니다. 법령상 보관이 필요한 정보는 해당 기간 동안 별도 보관 후
        파기합니다.
      </p>

      <h2 style={h2}>5. 문의처</h2>
      <p style={p}>
        계정 및 데이터 삭제 관련 문의:{' '}
        <a href="mailto:dzn7777@gmail.com" style={{ color: '#1A6DFF' }}>
          dzn7777@gmail.com
        </a>
      </p>
    </main>
  )
}
