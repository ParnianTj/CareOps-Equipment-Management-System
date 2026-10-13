import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { MachineManagementPage } from '@/components/machine-management/machine-management-page'

export const metadata: Metadata = {
  title: 'Protokoll/Aufnahmegeräte | Schlienz Connect',
  description: 'Manage protocol and recording devices in Schlienz Connect.',
}

export default function ProtocolDevicesPage() {
  return (
    <AppShell>
      <MachineManagementPage
        title="Protokoll/Aufnahmegeräte"
        description="View and manage protocol and recording devices."
        emptyMessage="No protocol or recording devices have been added yet."
      />
    </AppShell>
  )
}
