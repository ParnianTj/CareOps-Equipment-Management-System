import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { DeploymentDetails } from '@/components/deployments/deployment-details'

export const metadata: Metadata = {
  title: 'Bereitstellungsdetails | CareOps',
  description: 'Details zu einer Bereitstellung der CareOps Gruppe.',
}

export default async function DeploymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <AppShell>
      <DeploymentDetails deploymentId={id} />
    </AppShell>
  )
}
