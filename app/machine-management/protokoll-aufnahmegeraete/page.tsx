import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { ProtocolDevicesOverview } from '@/components/machine-management/protocol-devices-overview'

export const metadata: Metadata = {
  title: 'Protokoll/Aufnahmegeräte | Schlienz Connect',
  description: 'Manage protocol and recording devices in Schlienz Connect.',
}

export default function ProtocolDevicesPage() {
  return (
    <AppShell>
      <ProtocolDevicesOverview />
    </AppShell>
  )
}
