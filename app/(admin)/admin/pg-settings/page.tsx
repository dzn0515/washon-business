'use client'

import { useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { fetchAdminPgSettingsStatus, fetchAdminTrialPolicy } from '@/lib/admin-api'

export default function AdminPgSettingsPage() {
  const [pg, setPg] = useState<Record<string, unknown> | null>(null)
  const [trial, setTrial] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    void Promise.all([fetchAdminPgSettingsStatus(), fetchAdminTrialPolicy()]).then(([a, b]) => {
      setPg(a)
      setTrial(b)
    })
  }, [])

  return (
    <div className="space-y-4 p-6">
      <AdminPageHeader
        title="PG 설정 상태"
        description="비밀키 값은 절대 표시하지 않습니다. configured 여부만 확인합니다."
      />
      <pre className="overflow-auto rounded border bg-white p-4 text-xs">
        {JSON.stringify({ pg, trial }, null, 2)}
      </pre>
    </div>
  )
}
