'use client'

import { useMemo, useState } from 'react'
import { FilterX, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProjects } from '@/components/projects-provider'
import { RecentProjectsTable } from '@/components/dashboard/recent-projects-table'
import type { Language } from '@/components/app-shell'
import { getOrgName, organizations, statusLabels, type ProjectStatus } from '@/lib/dashboard-data'

export function ProjectsOverview({ language = 'de' }: { language?: Language }) {
  const { projects, openCreateProject, openEditProject, deleteProject } = useProjects()
  const sorted = useMemo(() => [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [projects])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('')
  const [organizationFilter, setOrganizationFilter] = useState('')
  const isEnglish = language === 'en'
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(language)
    return sorted.filter((project) => {
      const matchesSearch = !query || [
        project.name,
        project.location,
        getOrgName(project.orgId),
        project.createdBy,
      ].some((value) => value.toLocaleLowerCase(language).includes(query))
      return matchesSearch
        && (!statusFilter || project.status === statusFilter)
        && (!organizationFilter || project.orgId === organizationFilter)
    })
  }, [language, organizationFilter, search, sorted, statusFilter])
  const hasActiveFilters = Boolean(search || statusFilter || organizationFilter)

  function confirmDelete(projectName: string) {
    return window.confirm(
      isEnglish
        ? `Delete "${projectName}"? This cannot be undone.`
        : `„${projectName}“ wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`,
    )
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">
            Z-part group · {isEnglish ? 'Project management' : 'Projektverwaltung'}
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-balance sm:text-[32px]">
            {isEnglish ? 'Project List' : 'Projektliste'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEnglish ? 'An overview of all projects in your organization.' : 'Alle Projekte Ihrer Organisation im Überblick.'}
          </p>
        </div>
        <Button size="lg" className="h-11 gap-2 self-start rounded-xl px-4 font-semibold shadow-sm sm:self-auto" onClick={openCreateProject}>
          <Plus className="size-4" aria-hidden="true" />
          {isEnglish ? 'Create project' : 'Projekt erstellen'}
        </Button>
      </div>

      <section
        aria-label={isEnglish ? 'Search and filter projects' : 'Projekte suchen und filtern'}
        className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5"
      >
        <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isEnglish ? 'Search projects, locations, organizations...' : 'Projekte, Orte, Organisationen suchen...'}
            aria-label={isEnglish ? 'Search projects' : 'Projekte suchen'}
            className="h-10 pl-9"
          />
        </div>
        <label className="sr-only" htmlFor="project-status-filter">
          {isEnglish ? 'Filter by status' : 'Nach Status filtern'}
        </label>
        <select
          id="project-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ProjectStatus | '')}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-w-[150px] sm:flex-1"
        >
          <option value="">{isEnglish ? 'All statuses' : 'Alle Status'}</option>
          {(Object.keys(statusLabels) as ProjectStatus[]).map((status) => (
            <option key={status} value={status}>
              {isEnglish
                ? { created: 'Created', datasets: 'Data received', report: 'Report ready', completed: 'Completed' }[status]
                : statusLabels[status]}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="project-organization-filter">
          {isEnglish ? 'Filter by organization' : 'Nach Organisation filtern'}
        </label>
        <select
          id="project-organization-filter"
          value={organizationFilter}
          onChange={(event) => setOrganizationFilter(event.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-w-[150px] sm:flex-1"
        >
          <option value="">{isEnglish ? 'All organizations' : 'Alle Organisationen'}</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>{organization.name}</option>
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
              setOrganizationFilter('')
            }}
          >
            <FilterX className="size-4" aria-hidden="true" />
            {isEnglish ? 'Clear filters' : 'Filter zurücksetzen'}
          </Button>
        )}
      </section>

      <RecentProjectsTable
        projects={filteredProjects}
        title={isEnglish ? 'Project list' : 'Projektliste'}
        description={isEnglish ? 'Sorted by creation date' : 'Sortiert nach Erstellungsdatum'}
        emptyMessage={isEnglish ? 'No projects match your search or filters.' : 'Keine Projekte entsprechen Ihrer Suche oder den Filtern.'}
        projectCountLabel={isEnglish ? 'projects' : 'Projekte'}
        screwCountLabel={isEnglish ? 'Screw count' : 'Schraubenanzahl'}
        numberLocale={isEnglish ? 'en' : 'de'}
        showProjectMetrics
        scrollable={false}
        projectHref={(project) => `/projekte/details/${encodeURIComponent(project.id)}`}
        onEditProject={(project) => openEditProject(project.id)}
        onDeleteProject={(project) => {
          if (confirmDelete(project.name)) deleteProject(project.id)
        }}
      />
    </div>
  )
}
