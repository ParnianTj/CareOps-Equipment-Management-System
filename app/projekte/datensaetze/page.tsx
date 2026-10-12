import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { DatasetsOverview } from '@/components/projects/datasets-overview'

export const metadata: Metadata = {
  title: 'Datensätze | Schlienz Connect',
  description: 'Datensätze für Projekte der Z-part group.',
}

export default function DatasetsPage() {
  return (
    <AppShell>
      <DatasetsOverview />
    </AppShell>
  )
}
