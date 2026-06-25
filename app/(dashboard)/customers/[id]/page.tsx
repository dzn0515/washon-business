'use client'
import { useParams } from 'next/navigation'
import { useCustomer } from '@/hooks/useCustomers'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { CUSTOMER_GRADE_LABEL, CUSTOMER_GRADE_STYLE } from '@/constants'
import { formatMoney, formatPhone } from '@/lib/utils'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: customer } = useCustomer(Number(id))

  if (!customer) return <div className="text-sm text-gray-400">로딩 중...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{customer.name}</h2>
        <Badge className={CUSTOMER_GRADE_STYLE[customer.grade]}>{CUSTOMER_GRADE_LABEL[customer.grade]}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card><div className="text-xs text-gray-400">총 방문</div><div className="text-lg font-semibold">{customer.visit_count}회</div></Card>
        <Card><div className="text-xs text-gray-400">누적 금액</div><div className="text-lg font-semibold">{formatMoney(customer.total_spent)}</div></Card>
        <Card><div className="text-xs text-gray-400">마지막 방문</div><div className="text-sm font-medium">{customer.last_visit_at}</div></Card>
        <Card><div className="text-xs text-gray-400">다음 권장</div><div className="text-sm font-medium">{customer.next_recommended_visit}</div></Card>
      </div>

      <Card title="연락처 / 차량">
        <div className="text-sm space-y-1">
          <div>{formatPhone(customer.phone)}</div>
          {customer.vehicles.map((v) => (
            <div key={v.car_number} className="text-gray-500">{v.car_number} · {v.car_model}</div>
          ))}
        </div>
      </Card>

      <Card title="메모">
        <Input defaultValue={customer.memo} />
        <Button className="mt-2 w-full" size="sm">메모 저장</Button>
      </Card>

      <Card title="방문 이력">
        <div className="text-sm text-gray-400">최근 방문 기록 (API 연동 후 타임라인 표시)</div>
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1" variant="secondary">쿠폰 발급</Button>
        <Button className="flex-1">푸시 알림</Button>
      </div>
    </div>
  )
}
