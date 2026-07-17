'use client'

import { useCallback, useEffect, useState } from 'react'
import { PermissionGate } from '@/components/admin/PermissionGate'
import {
  adminApproveCompliance,
  adminApproveDocument,
  adminDocumentDownloadUrl,
  adminRejectCompliance,
  adminRejectDocument,
  adminRequestRevision,
  fetchAdminCompliance,
  listAdminCompliance,
  listAdminDocumentTypes,
  patchAdminDocumentType,
  type ComplianceStatus,
} from '@/lib/compliance-api'

export default function AdminPartnerCompliancePage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ComplianceStatus | null>(null)
  const [types, setTypes] = useState<Array<Record<string, unknown>>>([])
  const [toast, setToast] = useState<string | null>(null)
  const [tab, setTab] = useState<'list' | 'types'>('list')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listAdminCompliance({
        q: q || undefined,
        onboardingStatus: status === 'ALL' ? undefined : status,
      })
      setItems(res.items)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '목록 실패')
    } finally {
      setLoading(false)
    }
  }, [q, status])

  useEffect(() => {
    void loadList()
  }, [loadList])

  const openDetail = async (partnerId: string) => {
    setSelectedId(partnerId)
    try {
      setDetail(await fetchAdminCompliance(partnerId))
    } catch (e) {
      showToast(e instanceof Error ? e.message : '상세 실패')
    }
  }

  const loadTypes = async () => {
    try {
      setTypes(await listAdminDocumentTypes())
    } catch (e) {
      showToast(e instanceof Error ? e.message : '유형 목록 실패')
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          {toast}
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">입점·서류 심사</h1>
          <p className="mt-1 text-sm text-slate-500">
            사업자·정산·계약 서류를 검토합니다. 원본은 권한 있는 관리자만 열람합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-sm ${tab === 'list' ? 'bg-blue-600 text-white' : 'border'}`}
            onClick={() => setTab('list')}
          >
            심사 목록
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-sm ${tab === 'types' ? 'bg-blue-600 text-white' : 'border'}`}
            onClick={() => {
              setTab('types')
              void loadTypes()
            }}
          >
            서류 유형
          </button>
        </div>
      </div>

      {tab === 'types' ? (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">코드</th>
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">적용</th>
                <th className="px-3 py-2">필수</th>
                <th className="px-3 py-2">활성</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={String(t.id)} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{String(t.code)}</td>
                  <td className="px-3 py-2">{String(t.name)}</td>
                  <td className="px-3 py-2">{String(t.appliesToBusinessType)}</td>
                  <td className="px-3 py-2">{t.isRequired ? 'Y' : 'N'}</td>
                  <td className="px-3 py-2">
                    <PermissionGate menuKey="partner_compliance" action="edit">
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() =>
                          void patchAdminDocumentType(String(t.id), {
                            isActive: !t.isActive,
                          }).then(() => {
                            void loadTypes()
                            showToast('유형이 업데이트되었습니다.')
                          })
                        }
                      >
                        {t.isActive ? '비활성화' : '활성화'}
                      </button>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <input
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder="업체명/사업자번호"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">전체 상태</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="NEEDS_REVISION">NEEDS_REVISION</option>
              <option value="APPROVED">APPROVED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
            </select>
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
              onClick={() => void loadList()}
            >
              검색
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-white">
            {loading ? (
              <p className="p-4 text-sm text-slate-400">불러오는 중...</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2">업체</th>
                    <th className="px-3 py-2">사업자번호</th>
                    <th className="px-3 py-2">유형</th>
                    <th className="px-3 py-2">심사</th>
                    <th className="px-3 py-2">완료율</th>
                    <th className="px-3 py-2">반려</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr
                      key={String(row.partnerId)}
                      className="cursor-pointer border-t hover:bg-slate-50"
                      onClick={() => void openDetail(String(row.partnerId))}
                    >
                      <td className="px-3 py-2 font-medium">{String(row.partnerName)}</td>
                      <td className="px-3 py-2">{String(row.businessRegistrationNumber || '-')}</td>
                      <td className="px-3 py-2">{String(row.businessEntityType)}</td>
                      <td className="px-3 py-2">{String(row.onboardingStatus)}</td>
                      <td className="px-3 py-2">{String(row.completionRate)}%</td>
                      <td className="px-3 py-2">{String(row.rejectedCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {selectedId && detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="font-semibold">{detail.partnerName}</h2>
                <p className="text-xs text-slate-400">{detail.onboardingStatus}</p>
              </div>
              <button type="button" onClick={() => setSelectedId(null)}>
                닫기
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <p className="text-sm">
                사업자 {detail.businessRegistrationNumber} · {detail.businessEntityType}
              </p>
              <p className="text-sm">
                계좌 {detail.settlementAccountNumberMasked || '-'} / {detail.settlementAccountHolder}
              </p>
              {detail.checklist.map((c) => (
                <div key={c.code} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {c.name} {c.isRequired && <span className="text-red-500">*</span>}
                      </p>
                      <p className="text-xs text-slate-400">{c.effectiveStatus}</p>
                    </div>
                    {c.document && (
                      <div className="flex flex-wrap gap-1">
                        <PermissionGate menuKey="partner_compliance" action="download">
                          <button
                            type="button"
                            className="rounded border px-2 py-1 text-xs"
                            onClick={() =>
                              void adminDocumentDownloadUrl(c.document!.id).then((r) =>
                                window.open(r.url, '_blank', 'noopener,noreferrer'),
                              )
                            }
                          >
                            열람
                          </button>
                        </PermissionGate>
                        <PermissionGate menuKey="partner_compliance" action="approve">
                          <button
                            type="button"
                            className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
                            onClick={() =>
                              void adminApproveDocument(c.document!.id).then(() =>
                                openDetail(selectedId),
                              )
                            }
                          >
                            승인
                          </button>
                        </PermissionGate>
                        <PermissionGate menuKey="partner_compliance" action="approve">
                          <button
                            type="button"
                            className="rounded bg-red-50 px-2 py-1 text-xs text-red-700"
                            onClick={() => {
                              const reason = window.prompt('반려 사유')
                              if (!reason) return
                              void adminRejectDocument(c.document!.id, reason).then(() =>
                                openDetail(selectedId),
                              )
                            }}
                          >
                            반려
                          </button>
                        </PermissionGate>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 border-t p-4">
              <PermissionGate menuKey="partner_compliance" action="approve">
                <button
                  type="button"
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white"
                  onClick={() =>
                    void adminApproveCompliance(selectedId).then(() => {
                      showToast('전체 승인')
                      void openDetail(selectedId)
                      void loadList()
                    })
                  }
                >
                  전체 승인
                </button>
              </PermissionGate>
              <PermissionGate menuKey="partner_compliance" action="edit">
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2 text-sm"
                  onClick={() => {
                    const reason = window.prompt('수정 요청 사유')
                    if (!reason) return
                    void adminRequestRevision(selectedId, reason).then(() => {
                      showToast('수정 요청')
                      void openDetail(selectedId)
                      void loadList()
                    })
                  }}
                >
                  수정 요청
                </button>
              </PermissionGate>
              <PermissionGate menuKey="partner_compliance" action="approve">
                <button
                  type="button"
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
                  onClick={() => {
                    const reason = window.prompt('반려 사유')
                    if (!reason) return
                    void adminRejectCompliance(selectedId, reason).then(() => {
                      showToast('반려')
                      void openDetail(selectedId)
                      void loadList()
                    })
                  }}
                >
                  전체 반려
                </button>
              </PermissionGate>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
