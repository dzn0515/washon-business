'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FileUp, RefreshCw } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  fetchMyDocuments,
  uploadBusinessRegistration,
  type PartnerDocument,
} from '@/lib/store-images-api'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

const ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp'

const STATUS_LABEL: Record<string, string> = {
  PENDING: '심사 대기',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
}

export default function BusinessRegistrationUploader() {
  const { isDemo } = useDemoMode()
  const [doc, setDoc] = useState<PartnerDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [lastFile, setLastFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (isDemo) {
      setLoading(false)
      setError('데모 모드에서는 문서 업로드를 사용할 수 없습니다.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const items = await fetchMyDocuments()
      const reg = items.find((d) => d.documentType === 'BUSINESS_REGISTRATION') ?? null
      setDoc(reg)
    } catch (e) {
      setError((e as Error).message || '문서를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => {
    void load()
  }, [load])

  async function onUpload(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    setMessage(null)
    setLastFile(file)
    try {
      const uploaded = await uploadBusinessRegistration(file)
      setDoc(uploaded)
      setMessage('사업자등록증이 업로드되었습니다. 관리자 심사를 기다려 주세요.')
    } catch (e) {
      setError((e as Error).message || '업로드에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="사업자등록증">
      <p className="text-sm text-gray-500 mb-4">
        비공개로 저장되며 고객앱·공개 API에 노출되지 않습니다. PDF 또는 이미지, 최대 5MB.
      </p>

      {message && (
        <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
          {lastFile && !busy && (
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => void onUpload(lastFile)}
            >
              재시도
            </button>
          )}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중…</p>
      ) : (
        <div className="space-y-3">
          {doc ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">파일</span>
                <span className="font-medium text-right truncate">
                  {doc.originalFilename || `문서 #${doc.id}`}
                </span>
              </div>
              <div className="flex justify-between gap-3 mt-2">
                <span className="text-gray-500">상태</span>
                <span className="font-medium">{STATUS_LABEL[doc.status] ?? doc.status}</span>
              </div>
              {doc.uploadedAt && (
                <div className="flex justify-between gap-3 mt-2">
                  <span className="text-gray-500">업로드</span>
                  <span className="text-gray-700">{doc.uploadedAt.slice(0, 10)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-xl">
              등록된 사업자등록증이 없습니다.
            </p>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              void onUpload(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || isDemo}
              onClick={() => inputRef.current?.click()}
            >
              <FileUp size={14} className="mr-1" />
              {busy ? '업로드 중…' : doc ? '파일 교체' : '사업자등록증 업로드'}
            </Button>
            {doc && (
              <Button size="sm" variant="secondary" disabled={busy || isDemo} onClick={() => void load()}>
                <RefreshCw size={14} className="mr-1" />
                상태 새로고침
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
