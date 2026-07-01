'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import { fetchAdminAllBusinesses, type AdminBusinessListItem } from '@/lib/admin-api'
import { downloadQR, getStoreUrl } from '@/lib/admin-qr'
import { CATEGORY_LABELS } from '@/types'

export default function AdminQRPage() {
  const { showToast, ToastComponent } = useToast()
  const [businesses, setBusinesses] = useState<AdminBusinessListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [preview, setPreview] = useState<AdminBusinessListItem | null>(null)
  const qrContainerRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdminAllBusinesses()
      setBusinesses(data)
    } catch {
      setError(true)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const copyLink = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(getStoreUrl(slug))
      showToast('링크가 복사되었습니다.', 'success')
    } catch {
      showToast('복사에 실패했습니다.', 'error')
    }
  }

  const handleDownload = async () => {
    if (!preview?.slug || !qrContainerRef.current) return
    const svg = qrContainerRef.current.querySelector('svg')
    if (!svg) return
    try {
      await downloadQR(preview.slug, svg)
      showToast('QR 파일이 다운로드되었습니다.', 'success')
    } catch {
      showToast('다운로드에 실패했습니다.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader title="QR 관리" description="업체별 예약 QR 코드 관리" />

      {error ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">업체 목록을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <AdminTable
            loading={loading}
            columns={[
              { key: 'name', label: '업체명' },
              { key: 'bizType', label: '업종' },
              { key: 'slug', label: 'Slug' },
              { key: 'storeUrl', label: 'Store URL' },
              { key: 'qrStatus', label: 'QR 상태' },
              { key: 'actions', label: '액션', width: '180px' },
            ]}
            data={businesses.map((b) => ({
              name: b.name,
              bizType: CATEGORY_LABELS[b.bizType] ?? b.bizType,
              slug: b.slug ?? '-',
              storeUrl: b.slug ? getStoreUrl(b.slug) : '-',
              qrStatus: b.slug ? (
                <AdminBadge label="QR 활성" variant="success" />
              ) : (
                <AdminBadge label="Slug 없음" variant="neutral" />
              ),
              actions: (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {b.slug && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreview(b)}
                        className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                      >
                        QR 보기
                      </button>
                      <button
                        type="button"
                        onClick={() => copyLink(b.slug!)}
                        className="px-2 py-1 text-xs border border-blue-200 text-blue-600 rounded hover:bg-blue-50"
                      >
                        링크 복사
                      </button>
                    </>
                  )}
                </div>
              ),
            }))}
            emptyMessage="업체가 없습니다."
          />
        </div>
      )}

      <AdminModal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name ?? 'QR 미리보기'}
        size="md"
        footer={
          preview?.slug ? (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => copyLink(preview.slug!)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                링크 복사
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                PNG 다운로드
              </button>
            </div>
          ) : undefined
        }
      >
        {preview?.slug && (
          <div className="text-center space-y-4">
            <div className="flex justify-center" ref={qrContainerRef}>
              <QRCodeSVG value={getStoreUrl(preview.slug)} size={200} />
            </div>
            <p className="text-sm text-gray-600 break-all">{getStoreUrl(preview.slug)}</p>
          </div>
        )}
      </AdminModal>
    </div>
  )
}
