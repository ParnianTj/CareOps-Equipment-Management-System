import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { ProfileOverview } from '@/components/profile/profile-overview'

export const metadata: Metadata = {
  title: 'Profil | CareOps',
  description: 'Konto- und Einrichtungsdaten von Alex Berger.',
}

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileOverview />
    </AppShell>
  )
}
