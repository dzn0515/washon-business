const TOSS_SCRIPT_SRC = 'https://js.tosspayments.com/v1/payment'

type TossPaymentsClient = {
  requestBillingAuth: (
    method: string,
    opts: { customerKey: string; successUrl: string; failUrl: string },
  ) => Promise<void>
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsClient
  }
}

function loadTossScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('browser only'))
  if (window.TossPayments) return Promise.resolve()
  const existing = document.querySelector(`script[src="${TOSS_SCRIPT_SRC}"]`)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Toss SDK 로드 실패')))
    })
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TOSS_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Toss SDK 로드 실패'))
    document.head.appendChild(script)
  })
}

export async function requestTossBillingAuth(opts: {
  clientKey: string
  customerKey: string
  successUrl: string
  failUrl: string
}): Promise<void> {
  if (!opts.clientKey) {
    throw new Error('토스 결제 키가 설정되지 않았습니다.')
  }
  await loadTossScript()
  if (!window.TossPayments) {
    throw new Error('Toss Payments SDK를 불러오지 못했습니다.')
  }
  const tossPayments = window.TossPayments(opts.clientKey)
  await tossPayments.requestBillingAuth('카드', {
    customerKey: opts.customerKey,
    successUrl: opts.successUrl,
    failUrl: opts.failUrl,
  })
}
