'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  deleteGalleryImage,
  fetchStoreImages,
  uploadStoreImage,
  type GalleryImage,
  type ImageUploadKind,
  type StoreImages,
} from '@/lib/store-images-api'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

const ACCEPT = 'image/jpeg,image/png,image/webp'

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

function Preview({ url, alt, className }: { url: string; alt: string; className?: string }) {
  if (!url) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center text-xs text-gray-400 ${className ?? ''}`}>
        이미지 없음
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={`object-cover bg-gray-50 ${className ?? ''}`} />
  )
}

export default function StoreImagesManager() {
  const { isDemo } = useDemoMode()
  const [images, setImages] = useState<StoreImages>({ logoUrl: '', bannerUrl: '', gallery: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<Record<string, UploadState>>({})
  const [lastFiles, setLastFiles] = useState<Partial<Record<ImageUploadKind, File>>>({})
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (isDemo) {
      setLoading(false)
      setError('데모 모드에서는 이미지 업로드를 사용할 수 없습니다.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStoreImages()
      setImages(data)
    } catch (e) {
      setError((e as Error).message || '이미지를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => {
    void load()
  }, [load])

  async function onUpload(kind: ImageUploadKind, file: File | undefined) {
    if (!file) return
    setBusy(kind)
    setUploadState((prev) => ({ ...prev, [kind]: 'uploading' }))
    setMessage(null)
    setError(null)
    setLastFiles((prev) => ({ ...prev, [kind]: file }))
    try {
      const result = await uploadStoreImage(kind, file)
      if (kind === 'logo') {
        setImages((prev) => ({ ...prev, logoUrl: result.url }))
      } else if (kind === 'banner') {
        setImages((prev) => ({ ...prev, bannerUrl: result.url }))
      } else {
        await load()
      }
      setUploadState((prev) => ({ ...prev, [kind]: 'success' }))
      setMessage(
        kind === 'logo'
          ? '로고가 저장되었습니다.'
          : kind === 'banner'
            ? '대표 이미지가 저장되었습니다.'
            : '시공사진이 추가되었습니다.',
      )
    } catch (e) {
      setUploadState((prev) => ({ ...prev, [kind]: 'error' }))
      setError((e as Error).message || '업로드에 실패했습니다.')
    } finally {
      setBusy(null)
    }
  }

  async function onDelete(item: GalleryImage) {
    if (!window.confirm('이 시공사진을 삭제할까요?')) return
    setBusy(`del-${item.id}`)
    setError(null)
    try {
      await deleteGalleryImage(item.id)
      setImages((prev) => ({
        ...prev,
        gallery: prev.gallery.filter((g) => g.id !== item.id),
      }))
      setMessage('시공사진이 삭제되었습니다.')
    } catch (e) {
      setError((e as Error).message || '삭제에 실패했습니다.')
    } finally {
      setBusy(null)
    }
  }

  function statusHint(kind: ImageUploadKind): string | null {
    const s = uploadState[kind]
    if (s === 'uploading') return '업로드 중…'
    if (s === 'success') return '성공'
    if (s === 'error') return '실패 — 재시도 가능'
    return null
  }

  return (
    <Card title="매장 이미지">
      <p className="text-sm text-gray-500 mb-4">
        로고·대표 이미지·시공사진을 파일로 업로드합니다. jpg/png/webp, 최대 5MB. (GCS 공개 저장)
      </p>

      {message && (
        <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
          {lastFiles.logo && uploadState.logo === 'error' && (
            <button type="button" className="ml-2 underline" onClick={() => void onUpload('logo', lastFiles.logo)}>
              로고 재시도
            </button>
          )}
          {lastFiles.banner && uploadState.banner === 'error' && (
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => void onUpload('banner', lastFiles.banner)}
            >
              배너 재시도
            </button>
          )}
          {lastFiles.gallery && uploadState.gallery === 'error' && (
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => void onUpload('gallery', lastFiles.gallery)}
            >
              시공사진 재시도
            </button>
          )}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">로고 이미지</p>
              <Preview url={images.logoUrl} alt="로고" className="w-24 h-24 rounded-xl border border-gray-100" />
              {statusHint('logo') && <p className="text-xs text-gray-400">{statusHint('logo')}</p>}
              <input
                ref={logoRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                  void onUpload('logo', e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!!busy || isDemo}
                onClick={() => logoRef.current?.click()}
              >
                <Upload size={14} className="mr-1" />
                {busy === 'logo' ? '업로드 중…' : '로고 업로드'}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">대표 / 배너 이미지</p>
              <Preview
                url={images.bannerUrl}
                alt="배너"
                className="w-full h-28 rounded-xl border border-gray-100"
              />
              {statusHint('banner') && <p className="text-xs text-gray-400">{statusHint('banner')}</p>}
              <input
                ref={bannerRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                  void onUpload('banner', e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!!busy || isDemo}
                onClick={() => bannerRef.current?.click()}
              >
                <Upload size={14} className="mr-1" />
                {busy === 'banner' ? '업로드 중…' : '대표 이미지 업로드'}
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">시공사진 갤러리</p>
              <div>
                <input
                  ref={galleryRef}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    void onUpload('gallery', e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!!busy || isDemo}
                  onClick={() => galleryRef.current?.click()}
                >
                  <ImagePlus size={14} className="mr-1" />
                  {busy === 'gallery' ? '업로드 중…' : '시공사진 추가'}
                </Button>
              </div>
            </div>
            {statusHint('gallery') && <p className="text-xs text-gray-400 mb-2">{statusHint('gallery')}</p>}

            {images.gallery.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-xl">
                등록된 시공사진이 없습니다.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.gallery.map((item) => (
                  <div
                    key={item.id}
                    className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
                  >
                    <Preview url={item.imageUrl} alt={item.caption || '시공사진'} className="w-full h-28" />
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => void onDelete(item)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity disabled:opacity-40"
                      aria-label="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
