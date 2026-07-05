'use client'

import { useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS_LABEL,
  type SubscriptionPlanId,
  type SubscriptionStatus,
} from '@/lib/billing/catalog'
import { handleAdminSubscriptionAction } from '@/lib/subscriptions/handleAdminSubscriptionAction'
import {
  ADMIN_PAYMENT_STATUS_LABEL,
  type AdminSubscription,
} from '@/lib/subscriptions/types'
import { formatBillingDate, planName } from '@/lib/subscriptions/utils'
import { mockAdminSubscriptions } from '@/lib/mock/admin-subscriptions'

type FilterKey = 'all' | SubscriptionStatus

const STATUS_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'free_trial', label: '무료' },
  { key: 'active', label: '이용중' },
  { key: 'expiring', label: '만료예정' },
  { key: 'expired', label: '만료' },
  { key: 'payment_failed', label: '결제실패' },
]

const STATUS_VARIANT: Record<
  SubscriptionStatus,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  free_trial: 'info',
  active: 'success',
  payment_pending: 'warning',
  expiring: 'warning',
  expired: 'neutral',
  pending: 'info',
  payment_failed: 'error',
}

const PAYMENT_VARIANT: Record<
  AdminSubscription['paymentStatus'],
  'success' | 'warning' | 'error' | 'neutral'
> = {
  paid: 'success',
  pending: 'warning',
  failed: 'error',
  none: 'neutral',
}

export default function AdminSubscriptionsPage() {
  const { showToast, ToastComponent } = useToast()
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>(mockAdminSubscriptions)
  const [statusTab, setStatusTab] = useState<FilterKey>('all')
  const [detail, setDetail] = useState<AdminSubscription | null>(null)
  const [adminMemo, setAdminMemo] = useState('')
  const [changePlanId, setChangePlanId] = useState<SubscriptionPlanId>('basic')
  const [changeStatus, setChangeStatus] = useState<SubscriptionStatus>('active')
  const [extendDays, setExtendDays] = useState('30')
  const [processing, setProcessing] = useState(false)

  const filtered = useMemo(
    () =>
      statusTab === 'all'
        ? subscriptions
        : subscriptions.filter((s) => s.status === statusTab),
    [subscriptions, statusTab],
  )

  const openDetail = (sub: AdminSubscription) => {
    setDetail(sub)
    setAdminMemo(sub.adminMemo)
    setChangePlanId(sub.currentPlanId)
    setChangeStatus(sub.status)
  }

  const closeDetail = () => setDetail(null)

  const patchSubscription = (updated: AdminSubscription) => {
    setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setDetail(updated)
  }

  const runAction = async (
    action: Parameters<typeof handleAdminSubscriptionAction>[1],
  ) => {
    if (!detail) return
    setProcessing(true)
    const result = await handleAdminSubscriptionAction(
      { ...detail, adminMemo },
      action,
    )
    setProcessing(false)
    if (!result.success) {
      showToast(result.message, 'warning')
      return
    }
    patchSubscription({ ...result.subscription, adminMemo })
    showToast(result.message, 'success')
  }

  const tableData = filtered.map((sub) => ({
    id: sub.id,
    businessName: <span className="font-medium text-gray-900">{sub.businessName}</span>,
    plan: planName(sub.currentPlanId),
    status: (
      <AdminBadge
        label={SUBSCRIPTION_STATUS_LABEL[sub.status]}
        variant={STATUS_VARIANT[sub.status]}
      />
    ),
    trialEnd: formatBillingDate(sub.trialEndDate),
    nextPayment: formatBillingDate(sub.nextPaymentDate),
    autoRenewal: (
      <span className={sub.autoRenewal ? 'text-green-600 font-medium' : 'text-gray-400'}>
        {sub.autoRenewal ? 'ON' : 'OFF'}
      </span>
    ),
    paymentStatus: (
      <AdminBadge
        label={ADMIN_PAYMENT_STATUS_LABEL[sub.paymentStatus]}
        variant={PAYMENT_VARIANT[sub.paymentStatus]}
      />
    ),
  }))

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="구독 관리"
        description="업체별 요금제·구독 상태 확인 및 Mock 운영 조치"
      />

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
        PG/API 미연동 · 상태 변경·연장·종료는 Mock 처리만 됩니다.
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? subscriptions.length
              : subscriptions.filter((s) => s.status === tab.key).length
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusTab(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                statusTab === tab.key
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label} {count}
            </button>
          )
        })}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <AdminTable
          columns={[
            { key: 'businessName', label: '업체명' },
            { key: 'plan', label: '현재 플랜' },
            { key: 'status', label: '상태' },
            { key: 'trialEnd', label: '무료 종료일' },
            { key: 'nextPayment', label: '다음 결제일' },
            { key: 'autoRenewal', label: '자동 갱신' },
            { key: 'paymentStatus', label: '결제 상태' },
          ]}
          data={tableData}
          emptyMessage="해당 상태의 구독이 없습니다."
          onRowClick={(row) => {
            const sub = subscriptions.find((s) => s.id === row.id)
            if (sub) openDetail(sub)
          }}
        />
      </div>

      <AdminModal
        open={!!detail}
        onClose={closeDetail}
        title="구독 상세"
        size="lg"
      >
        {detail && (
          <div className="space-y-5 text-sm">
            <section>
              <p className="text-xs font-medium text-gray-400 mb-2">업체</p>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900">{detail.businessName}</p>
                <p className="text-gray-600 mt-1">
                  {detail.ownerName} · {detail.ownerPhone}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-400">현재 플랜</p>
                <p className="font-semibold">{planName(detail.currentPlanId)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">상태</p>
                <AdminBadge
                  label={SUBSCRIPTION_STATUS_LABEL[detail.status]}
                  variant={STATUS_VARIANT[detail.status]}
                />
              </div>
              <div>
                <p className="text-xs text-gray-400">무료 종료일</p>
                <p>{formatBillingDate(detail.trialEndDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">다음 결제일</p>
                <p>{formatBillingDate(detail.nextPaymentDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">자동 갱신</p>
                <p className={detail.autoRenewal ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {detail.autoRenewal ? 'ON' : 'OFF'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">결제 상태</p>
                <AdminBadge
                  label={ADMIN_PAYMENT_STATUS_LABEL[detail.paymentStatus]}
                  variant={PAYMENT_VARIANT[detail.paymentStatus]}
                />
              </div>
            </section>

            <section>
              <p className="text-xs font-medium text-gray-400 mb-1">관리자 메모</p>
              <textarea
                value={adminMemo}
                onChange={(e) => setAdminMemo(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none"
              />
            </section>

            <section className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs font-medium text-gray-400">Mock 운영 조치</p>

              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-400">플랜 변경</label>
                  <select
                    value={changePlanId}
                    onChange={(e) => setChangePlanId(e.target.value as SubscriptionPlanId)}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  >
                    {SUBSCRIPTION_PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => runAction({ type: 'change_plan', planId: changePlanId })}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0"
                >
                  플랜 변경
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-400">무료 기간 연장 (일)</label>
                  <input
                    type="number"
                    min={1}
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() =>
                    runAction({ type: 'extend_trial', days: Number(extendDays) || 30 })
                  }
                  className="px-4 py-2 rounded-xl border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50 disabled:opacity-50 shrink-0"
                >
                  무료 연장
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-400">상태 변경</label>
                  <select
                    value={changeStatus}
                    onChange={(e) => setChangeStatus(e.target.value as SubscriptionStatus)}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  >
                    {(Object.keys(SUBSCRIPTION_STATUS_LABEL) as SubscriptionStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {SUBSCRIPTION_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => runAction({ type: 'change_status', status: changeStatus })}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 shrink-0"
                >
                  상태 변경
                </button>
              </div>

              <button
                type="button"
                disabled={processing}
                onClick={() => runAction({ type: 'force_end' })}
                className="w-full px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                강제 종료
              </button>
            </section>
          </div>
        )}
      </AdminModal>
    </div>
  )
}
