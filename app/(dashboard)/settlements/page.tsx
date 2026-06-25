'use client'
import { useState } from 'react'
import useSWR from 'swr'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { mockApi } from '@/lib/mock/data'
import { formatMoney } from '@/lib/utils'
import { Download } from 'lucide-react'

export default function SettlementsPage() {
  const [month] = useState('2026-06')
  const { data: settlements } = useSWR('settlements', () => mockApi.getSettlements())

  const totalSales = settlements?.reduce((s, r) => s + r.total_sales, 0) ?? 0
  const totalFee = settlements?.reduce((s, r) => s + r.platform_fee, 0) ?? 0
  const pending = settlements?.filter((r) => r.status === 'PENDING').reduce((s, r) => s + r.settled_amount, 0) ?? 0

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm" defaultValue={month}>
          <option value="2026-06">2026년 6월</option>
          <option value="2026-05">2026년 5월</option>
        </select>
        <Button size="sm" variant="secondary"><Download size={14} className="mr-1" />엑셀/PDF</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><div className="text-xs text-gray-400">총 매출</div><div className="text-base font-semibold">{formatMoney(totalSales)}</div></Card>
        <Card><div className="text-xs text-gray-400">플랫폼 수수료</div><div className="text-base font-semibold">{formatMoney(totalFee)}</div></Card>
        <Card><div className="text-xs text-gray-400">정산 예정</div><div className="text-base font-semibold text-primary-600">{formatMoney(pending)}</div></Card>
      </div>

      <Card>
        <Table headers={['날짜', '예약', '매출', '수수료', '정산액', '상태']}>
          {settlements?.map((s) => (
            <tr key={s.date} className="border-b border-gray-50">
              <td className="py-2">{s.date}</td>
              <td className="py-2">{s.booking_count}건</td>
              <td className="py-2">{formatMoney(s.total_sales)}</td>
              <td className="py-2">{formatMoney(s.platform_fee)}</td>
              <td className="py-2 font-medium">{formatMoney(s.settled_amount)}</td>
              <td className="py-2">
                <Badge className={s.status === 'SETTLED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {s.status === 'SETTLED' ? '정산완료' : '대기'}
                </Badge>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
