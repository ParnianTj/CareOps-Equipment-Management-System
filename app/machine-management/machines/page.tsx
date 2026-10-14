import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { MachinesOverview } from '@/components/machine-management/machines-overview'

export const metadata: Metadata = {
  title: 'Machines | Schlienz Connect',
  description: 'Manage machines in Schlienz Connect.',
}

export default function MachinesPage() {
  return (
    <AppShell>
      <MachinesOverview />
    </AppShell>
  )
}
