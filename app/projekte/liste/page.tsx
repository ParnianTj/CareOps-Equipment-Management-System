import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { ProjectsOverview } from '@/components/projects/projects-overview'

export const metadata: Metadata = {
  title: 'Projektliste | Schlienz Connect',
  description: 'Alle Projekte der Z-part group im Überblick.',
}

export default function ProjectListPage() {
  return (
    <AppShell>
      <ProjectsOverview />
    </AppShell>
  )
}
