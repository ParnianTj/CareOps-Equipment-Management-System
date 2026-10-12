import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { ProfileOverview } from '@/components/profile/profile-overview'

export const metadata: Metadata = {
  title: 'Profile | Schlienz Connect',
  description: 'Account and organization details for Dominik Züger.',
}

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileOverview />
    </AppShell>
  )
}
