'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Download, ExternalLink, Printer } from 'lucide-react'
import Button from '@/components/ui/Button'
import { fetchBusinessMe } from '@/lib/api'
import { downloadQR, getStoreUrl } from '@/lib/admin-qr'
import { CARD } from '@/lib/dashboard-ui'

type BusinessMeResponse = Awaited<ReturnType<typeof fetchBusinessMe>> & {
  business_name?: string
}

export default function StoreQrPage() {
  const qrContainerRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [slug, setSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const me = (await fetchBusinessMe()) as BusinessMeResponse
      setBusinessName(me.business_name ?? me.name)
      setSlug(me.slug || null)
    } catch {
      setError(true)
      setBusinessName('')
      setSlug(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const storeUrl = slug ? getStoreUrl(slug) : ''

  async function copyLink() {
    if (!storeUrl) return
    try {
      await navigator.clipboard.writeText(storeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  async function handleDownload() {
    if (!slug || !qrContainerRef.current) return
    const svg = qrContainerRef.current.querySelector('svg')
    if (!svg) return
    await downloadQR(slug, svg)
  }

  function handlePrint() {
    window.print()
  }

  function openBookingPage() {
    if (!storeUrl) return
    window.open(storeUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className={`${CARD} text-center py-12 text-sm text-gray-500`}>
        매장 정보를 불러오는 중입니다...
      </div>
    )
  }

  if (error || !slug) {
    return (
      <div className={`${CARD} text-center py-12 space-y-4`}>
        <p className="text-sm text-gray-500">
          {error ? '매장 정보를 불러오지 못했습니다.' : '매장 slug가 설정되지 않았습니다.'}
        </p>
        {error && (
          <Button variant="secondary" size="sm" onClick={load}>
            다시 시도
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          #store-qr-print,
          #store-qr-print * {
            visibility: visible;
          }
          #store-qr-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
          }
        }
      `}</style>

      <div className="space-y-4 pb-8">
        <div className="no-print">
          <h2 className="text-lg font-semibold text-gray-900">매장 QR</h2>
          <p className="text-sm text-gray-500 mt-1">
            고객이 QR을 스캔하면 예약 페이지로 이동합니다.
          </p>
        </div>

        <div id="store-qr-print" className={`${CARD} max-w-md mx-auto text-center space-y-5`}>
          <div>
            <p className="text-xs text-gray-400 mb-1">매장명</p>
            <p className="text-lg font-semibold text-gray-900">{businessName}</p>
          </div>

          <div ref={qrContainerRef} className="flex justify-center py-2">
            <QRCodeSVG value={storeUrl} size={280} />
          </div>

          <p className="text-sm text-gray-600 break-all">{storeUrl}</p>

          <div className="no-print grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={copyLink}>
              <Copy size={14} className="mr-1.5" />
              예약 링크 복사
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download size={14} className="mr-1.5" />
              QR 다운로드
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer size={14} className="mr-1.5" />
              QR 인쇄
            </Button>
            <Button variant="secondary" size="sm" onClick={openBookingPage}>
              <ExternalLink size={14} className="mr-1.5" />
              예약페이지 열기
            </Button>
          </div>

          {copied && (
            <p className="no-print text-xs text-green-600">예약 링크가 복사되었습니다.</p>
          )}
        </div>
      </div>
    </>
  )
}
