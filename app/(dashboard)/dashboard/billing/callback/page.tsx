'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { checkoutSaasAd, checkoutSaasSubscription } from '@/lib/saas-billing-api'
import {
  clearPendingSaasCheckout,
  readPendingSaasCheckout,
} from '@/lib/billing/pendingCheckout'

function BillingCallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [message, setMessage] = useState('결제 정보를 확인하는 중…')

  useEffect(() => {
    const authKey = params.get('authKey') || params.get('auth_key')
    const customerKey = params.get('customerKey') || params.get('customer_key')
    const failCode = params.get('code')
    const failMessage = params.get('message')

    if (failCode || (!authKey && failMessage)) {
      setMessage(failMessage || '카드 등록에 실패했습니다.')
      const t = window.setTimeout(() => router.replace('/dashboard/billing?billing=fail'), 1600)
      return () => window.clearTimeout(t)
    }

    if (!authKey) {
      setMessage('인증 정보가 없습니다.')
      return
    }

    const pending = readPendingSaasCheckout()
    if (!pending) {
      setMessage('결제 요청 정보를 찾지 못했습니다. 요금제 화면에서 다시 시도해 주세요.')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        if (pending.kind === 'subscription') {
          await checkoutSaasSubscription({
            plan_id: pending.planId,
            auth_key: authKey,
            customer_key: customerKey ?? undefined,
            auto_renewal: pending.autoRenewal,
          })
          clearPendingSaasCheckout()
          if (!cancelled) router.replace('/dashboard/billing?billing=ok')
          return
        }
        let methodId: number | undefined
        let nextAuth: string | undefined = authKey
        for (const productId of pending.productIds) {
          const result = await checkoutSaasAd({
            product_id: productId,
            billing_method_id: methodId,
            auth_key: nextAuth,
            customer_key: customerKey ?? undefined,
          })
          methodId = result.billing_method.id
          nextAuth = undefined
        }
        if (pending.applicationProductIds?.length) {
          const { submitBusinessAdApplications } = await import('@/lib/ad-applications/business-api')
          await submitBusinessAdApplications(pending.applicationProductIds)
        }
        clearPendingSaasCheckout()
        if (!cancelled) router.replace('/dashboard/ads?billing=ok')
      } catch (e) {
        clearPendingSaasCheckout()
        if (!cancelled) {
          setMessage(e instanceof Error ? e.message : '결제에 실패했습니다.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [params, router])

  return (
    <div className="p-6 text-sm text-gray-600">
      <p>{message}</p>
    </div>
  )
}

export default function BillingCallbackPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-500">결제 처리 중…</p>}>
      <BillingCallbackInner />
    </Suspense>
  )
}
