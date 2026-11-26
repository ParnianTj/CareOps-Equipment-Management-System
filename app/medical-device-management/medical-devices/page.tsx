import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { MedicalDevicesOverview } from '@/components/medical-device-management/medical-devices-overview'

export const metadata: Metadata = {
  title: 'Medizingeräte | CareOps',
  description: 'Medizingeräte in CareOps verwalten.',
}

export default function MedicalDevicesPage() {
  return (
    <AppShell>
      <MedicalDevicesOverview />
    </AppShell>
  )
}
