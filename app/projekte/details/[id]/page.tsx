import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { ProjectDetails } from '@/components/projects/project-details'

export const metadata: Metadata = {
  title: 'Projektdetails | Schlienz Connect',
  description: 'Details zu einem Projekt der Z-part group.',
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <AppShell>
      <ProjectDetails projectId={id} />
    </AppShell>
  )
}
