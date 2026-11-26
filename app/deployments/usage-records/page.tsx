import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { UsageRecordsOverview } from '@/components/deployments/usage-records-overview'

export const metadata: Metadata = {
  title: 'Nutzungsdatensätze | CareOps',
  description: 'Nutzungsdatensätze für Bereitstellungen der CareOps Gruppe.',
}

export default function UsageRecordsPage() {
  return (
    <AppShell>
      <UsageRecordsOverview />
    </AppShell>
  )
}
