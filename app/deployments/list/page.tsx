import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { DeploymentsOverview } from '@/components/deployments/deployments-overview'

export const metadata: Metadata = {
  title: 'Bereitstellungsliste | CareOps',
  description: 'Alle Bereitstellungen der CareOps Gruppe im Überblick.',
}

export default function DeploymentListPage() {
  return (
    <AppShell>
      <DeploymentsOverview />
    </AppShell>
  )
}
