'use client'

import { useMemo } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useProjects } from '@/components/projects-provider'
import type { Language } from '@/components/app-shell'
import { StatsCards } from './stats-cards'
import { OrganizationActivity, type OrgActivity } from './organization-activity'
import { LatestReports } from './latest-reports'
import { RecentProjectsTable } from './recent-projects-table'
import { OrganizationTree } from './organization-tree'
import { ProjectLocationMap } from './project-location-map'
import { organizations, stableDemoCount } from '@/lib/dashboard-data'

type DashboardProps = {
  language?: Language
}

export function Dashboard({ language = 'de' }: DashboardProps) {
  const { projects, reports, openCreateProject } = useProjects()
  const t =
    language === 'en'
      ? {
          greeting: 'Welcome back, Dominik',
          subheading: 'Here is the current overview of your organization.',
          createProject: 'Create project',
          currentProjects: 'Current projects',
          projectDescription: 'Recently updated projects in your organization',
          screwCount: 'Screw count',
          projectCount: 'projects',
          viewAll: 'View all',
        }
      : {
          greeting: 'Willkommen zurück, Dominik',
          subheading: 'Hier ist die aktuelle Übersicht Ihrer Organisation.',
          createProject: 'Projekt erstellen',
          currentProjects: 'Aktuelle Projekte',
          projectDescription: 'Zuletzt aktualisierte Projekte in Ihrer Organisation',
          screwCount: 'Schraubenanzahl',
          projectCount: 'Projekte',
          viewAll: 'Alle ansehen',
        }

  const recentProjects = useMemo(
    () => [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [projects],
  )

  const activity = useMemo<OrgActivity[]>(
    () =>
      organizations
        .map((org) => {
          const projectCount = projects.filter((project) => project.orgId === org.id).length
          const reportCount = reports.filter((report) => report.orgId === org.id).length
          const hasRecordedActivity = projectCount > 0 || reportCount > 0
          return {
            orgId: org.id,
            name: org.name,
            projects: hasRecordedActivity ? projectCount : stableDemoCount(org.id, 10, 1),
            reports: hasRecordedActivity ? reportCount : stableDemoCount(org.id, 10, 2),
          }
        })
        .sort((a, b) => b.projects + b.reports - (a.projects + a.reports)),
    [projects, reports],
  )

  const activeProjects = projects.filter(
    (project) => project.status !== 'report' && project.status !== 'completed',
  ).length
  const memberCount = organizations.reduce(
    (total, organization) =>
      organization.id === 'z-part-group' ? total : total + (organization.members ?? 0),
    0,
  )

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">Administrator · Z-part group</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-balance sm:text-[32px]">{t.greeting}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.subheading}</p>
        </div>
        <Button
          className="h-11 gap-2 self-start rounded-xl px-4 font-semibold shadow-sm sm:self-auto"
          onClick={openCreateProject}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t.createProject}
        </Button>
      </div>

      <div className="grid items-stretch gap-5 md:grid-cols-2">
        <ProjectLocationMap projects={projects} language={language} />
        <LatestReports reports={reports} projects={projects} language={language} />
      </div>

      <StatsCards
        projects={projects.length}
        activeProjects={activeProjects}
        reports={reports.length}
        members={memberCount}
      />

      <div className="flex flex-col gap-5">
        <RecentProjectsTable
          projects={recentProjects.slice(0, 6)}
          title={t.currentProjects}
          description={t.projectDescription}
          projectCountLabel={t.projectCount}
          screwCountLabel={t.screwCount}
          numberLocale={language === 'en' ? 'en' : 'de'}
          showProjectMetrics
          projectHref={(project) => `/projekte/details/${encodeURIComponent(project.id)}`}
          action={
            <Link
              href="/projekte"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
            >
              {t.viewAll}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />
        <OrganizationActivity activity={activity} />
      </div>

      <div id="organisationen" className="scroll-mt-24">
        <OrganizationTree organizations={organizations} totalMembers={memberCount} />
      </div>
    </div>
  )
}
