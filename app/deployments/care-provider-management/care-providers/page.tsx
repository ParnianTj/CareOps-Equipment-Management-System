import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { CareProvidersPageHeader } from '@/components/care-providers/care-providers-page-header'
import { CareProviderTree } from '@/components/dashboard/care-provider-tree'
import { careProviders } from '@/lib/dashboard-data'

export const metadata: Metadata = {
  title: 'Einrichtungen | CareOps',
  description: 'Einrichtungsstruktur und Verantwortlichkeiten im Überblick.',
}

export default function CareProviderPage() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
        <CareProvidersPageHeader />

        <CareProviderTree careProviders={careProviders} />
      </div>
    </AppShell>
  )
}
