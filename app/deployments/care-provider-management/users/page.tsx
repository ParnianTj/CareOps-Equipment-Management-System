import type { Metadata } from 'next'
import { UsersOverview } from '@/components/care-providers/users-overview'

export const metadata: Metadata = {
  title: 'Benutzer | CareOps',
  description: 'Benutzer der Einrichtungsverwaltung anzeigen und verwalten.',
}

export default function UsersPage() {
  return <UsersOverview />
}
