'use client'
import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { mockBusiness } from '@/lib/mock/data'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Download } from 'lucide-react'

export default function BrandPage() {
  const [color, setColor] = useState(mockBusiness.primary_color)
  const url = `https://washon.kr/${mockBusiness.slug}`

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Card title="로고 / 배너">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400 mb-3">
            로고 이미지 업로드
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
            배너 이미지 업로드
          </div>
        </Card>

        <Card title="대표 컬러">
          <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg" />
            <Input value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </Card>

        <Card title="QR / URL">
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={url} size={120} />
          </div>
          <div className="flex gap-2">
            <Input value={url} readOnly className="text-xs" />
            <Button size="sm" variant="secondary"><Copy size={14} /></Button>
            <Button size="sm" variant="secondary"><Download size={14} /></Button>
          </div>
        </Card>
      </div>

      <Card title="실시간 미리보기">
        <div className="rounded-xl overflow-hidden border border-gray-200" style={{ borderTopColor: color, borderTopWidth: 4 }}>
          <div className="h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400">배너 영역</div>
          <div className="p-4">
            <div className="font-bold text-lg">{mockBusiness.name}</div>
            <div className="text-xs text-gray-500 mt-1">{mockBusiness.address}</div>
            <button className="w-full mt-4 py-2.5 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: color }}>
              예약하기
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
