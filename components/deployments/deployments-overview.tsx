'use client'

import { useMemo, useState } from 'react'
import { FilterX, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDeployments } from '@/components/deployments-provider'
import { RecentDeploymentsTable } from '@/components/dashboard/recent-deployments-table'
import type { Language } from '@/components/app-shell'
import { getCareProviderName, careProviders, statusLabels, type DeploymentStatus } from '@/lib/dashboard-data'

export function DeploymentsOverview({ language = 'de' }: { language?: Language }) {
  const { deployments, openCreateDeployment, openEditDeployment, deleteDeployment } = useDeployments()
  const sorted = useMemo(() => [...deployments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [deployments])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DeploymentStatus | ''>('')
  const [careProviderFilter, setCareProviderFilter] = useState('')
  const isEnglish = language === 'en'
  const filteredDeployments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(language)
    return sorted.filter((deployment) => {
      const matchesSearch = !query || [
        deployment.name,
        deployment.location,
        getCareProviderName(deployment.careProviderId),
        deployment.createdBy,
      ].some((value) => value.toLocaleLowerCase(language).includes(query))
      return matchesSearch
        && (!statusFilter || deployment.status === statusFilter)
        && (!careProviderFilter || deployment.careProviderId === careProviderFilter)
    })
  }, [language, careProviderFilter, search, sorted, statusFilter])
  const hasActiveFilters = Boolean(search || statusFilter || careProviderFilter)

  function confirmDelete(deploymentName: string) {
    return window.confirm(
      isEnglish
        ? `Delete "${deploymentName}"? This cannot be undone.`
        : `„${deploymentName}“ wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`,
    )
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">
            CareOps Gruppe · {isEnglish ? 'Deployment management' : 'Bereitstellungsverwaltung'}
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-balance sm:text-[32px]">
            {isEnglish ? 'Deployment List' : 'Bereitstellungsliste'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEnglish ? 'An overview of all deployments across your care providers.' : 'Alle Bereitstellungen Ihrer Einrichtung im Überblick.'}
          </p>
        </div>
        <Button size="lg" className="h-11 gap-2 self-start rounded-xl px-4 font-semibold shadow-sm sm:self-auto" onClick={openCreateDeployment}>
          <Plus className="size-4" aria-hidden="true" />
          {isEnglish ? 'Create deployment' : 'Bereitstellung erstellen'}
        </Button>
      </div>

      <section
        aria-label={isEnglish ? 'Search and filter deployments' : 'Bereitstellungen suchen und filtern'}
        className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5"
      >
        <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isEnglish ? 'Search deployments, locations, care providers...' : 'Bereitstellungen, Orte, Einrichtungen suchen...'}
            aria-label={isEnglish ? 'Search deployments' : 'Bereitstellungen suchen'}
            className="h-10 pl-9"
          />
        </div>
        <label className="sr-only" htmlFor="deployment-status-filter">
          {isEnglish ? 'Filter by status' : 'Nach Status filtern'}
        </label>
        <select
          id="deployment-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as DeploymentStatus | '')}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-w-[150px] sm:flex-1"
        >
          <option value="">{isEnglish ? 'All statuses' : 'Alle Status'}</option>
          {(Object.keys(statusLabels) as DeploymentStatus[]).map((status) => (
            <option key={status} value={status}>
              {isEnglish
                ? { created: 'Created', usageRecords: 'Data received', report: 'Report ready', completed: 'Completed' }[status]
                : statusLabels[status]}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="deployment-care-provider-filter">
          {isEnglish ? 'Filter by care provider' : 'Nach Einrichtung filtern'}
        </label>
        <select
          id="deployment-care-provider-filter"
          value={careProviderFilter}
          onChange={(event) => setCareProviderFilter(event.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-w-[150px] sm:flex-1"
        >
          <option value="">{isEnglish ? 'All care providers' : 'Alle Einrichtungen'}</option>
          {careProviders.map((careProvider) => (
            <option key={careProvider.id} value={careProvider.id}>{careProvider.name}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            className="h-10 shrink-0 gap-2"
            onClick={() => {
              setSearch('')
              setStatusFilter('')
              setCareProviderFilter('')
            }}
          >
            <FilterX className="size-4" aria-hidden="true" />
            {isEnglish ? 'Clear filters' : 'Filter zurücksetzen'}
          </Button>
        )}
      </section>

      <RecentDeploymentsTable
        deployments={filteredDeployments}
        title={isEnglish ? 'Deployment list' : 'Bereitstellungsliste'}
        description={isEnglish ? 'Sorted by creation date' : 'Sortiert nach Erstellungsdatum'}
        emptyMessage={isEnglish ? 'No deployments match your search or filters.' : 'Keine Bereitstellungen entsprechen Ihrer Suche oder den Filtern.'}
        deploymentCountLabel={isEnglish ? 'deployments' : 'Bereitstellungen'}
        deviceTypeCountLabel={isEnglish ? 'Device count' : 'Geräteanzahl'}
        numberLocale={isEnglish ? 'en' : 'de'}
        showDeploymentMetrics
        scrollable={false}
        deploymentHref={(deployment) => `/deployments/details/${encodeURIComponent(deployment.id)}`}
        onEditDeployment={(deployment) => openEditDeployment(deployment.id)}
        onDeleteDeployment={(deployment) => {
          if (confirmDelete(deployment.name)) deleteDeployment(deployment.id)
        }}
      />
    </div>
  )
}
