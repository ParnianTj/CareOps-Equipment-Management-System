import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { DeploymentDetails } from '@/components/deployments/deployment-details'

export const metadata: Metadata = {
  title: 'Bereitstellungsdetails | CareOps',
  description: 'Bereitstellungen auswählen und Bereitstellungsdetails ansehen.',
}

export default function DeploymentDetailsPage() {
  return (
    <AppShell>
      <DeploymentDetails />
    </AppShell>
  )
}
