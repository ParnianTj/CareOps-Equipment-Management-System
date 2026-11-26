import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { MonitoringDevicesOverview } from '@/components/medical-device-management/monitoring-devices-overview'

export const metadata: Metadata = {
  title: 'Monitoring-/Datenlogger-Geräte | CareOps',
  description: 'Monitoring- und Datenlogger-Geräte in CareOps verwalten.',
}

export default function MonitoringDevicesPage() {
  return (
    <AppShell>
      <MonitoringDevicesOverview />
    </AppShell>
  )
}
