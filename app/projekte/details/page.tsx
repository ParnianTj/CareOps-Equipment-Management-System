import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { ProjectDetails } from '@/components/projects/project-details'

export const metadata: Metadata = {
  title: 'Projektdetails | Schlienz Connect',
  description: 'Projekte auswählen und Projektdetails ansehen.',
}

export default function ProjectDetailsPage() {
  return (
    <AppShell>
      <ProjectDetails />
    </AppShell>
  )
}
