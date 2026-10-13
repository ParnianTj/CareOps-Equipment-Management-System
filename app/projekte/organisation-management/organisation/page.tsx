import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { OrganizationTree } from '@/components/dashboard/organization-tree'
import { organizations } from '@/lib/dashboard-data'

export const metadata: Metadata = {
  title: 'Organisation | Schlienz Connect',
  description: 'Organisationsstruktur und Verantwortlichkeiten im Überblick.',
}

export default function OrganisationPage() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-primary">Z-part group · Organisationsverwaltung</p>
            <h1 className="text-[28px] font-semibold tracking-tight text-balance sm:text-[32px]">Organisation</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Organisationen, Zuständigkeiten und Mitglieder im Überblick.
            </p>
          </div>
        </div>

        <OrganizationTree organizations={organizations} />
      </div>
    </AppShell>
  )
}
