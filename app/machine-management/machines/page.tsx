import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { MachineManagementPage } from '@/components/machine-management/machine-management-page'

export const metadata: Metadata = {
  title: 'Machines | Schlienz Connect',
  description: 'Manage machines in Schlienz Connect.',
}

export default function MachinesPage() {
  return (
    <AppShell>
      <MachineManagementPage
        title="Machines"
        description="View and manage registered machines."
        emptyMessage="No machines have been added yet."
      />
    </AppShell>
  )
}
