import type { Metadata } from 'next'
import { UsersOverview } from '@/components/organizations/users-overview'

export const metadata: Metadata = {
  title: 'Benutzer | Schlienz Connect',
  description: 'Benutzer der Organisationsverwaltung anzeigen und verwalten.',
}

export default function UsersPage() {
  return <UsersOverview />
}
