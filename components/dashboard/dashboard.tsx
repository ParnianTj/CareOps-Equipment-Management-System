'use client'

import { useMemo } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useDeployments } from '@/components/deployments-provider'
import type { Language } from '@/components/app-shell'
import { StatsCards } from './stats-cards'
import { CareProviderActivity, type CareProviderActivityEntry } from './care-provider-activity'
import { LatestReports } from './latest-reports'
import { RecentDeploymentsTable } from './recent-deployments-table'
import { DeploymentLocationMap } from './deployment-location-map'
import { careProviders, stableDemoCount } from '@/lib/dashboard-data'

type DashboardProps = {
  language?: Language
}

export function Dashboard({ language = 'de' }: DashboardProps) {
  const { deployments, reports, openCreateDeployment } = useDeployments()
  const t =
    language === 'en'
      ? {
          greeting: 'Welcome back, Alex',
          subheading: 'Here is the current overview across your care providers.',
          createDeployment: 'Create deployment',
          currentDeployments: 'Current deployments',
          deploymentDescription: 'Recently updated deployments across your care providers',
          deviceTypeCount: 'Device count',
          deploymentCount: 'deployments',
          viewAll: 'View all',
        }
      : {
          greeting: 'Willkommen zurück, Alex',
          subheading: 'Hier ist die aktuelle Übersicht Ihrer Einrichtung.',
          createDeployment: 'Bereitstellung erstellen',
          currentDeployments: 'Aktuelle Bereitstellungen',
          deploymentDescription: 'Zuletzt aktualisierte Bereitstellungen in Ihrer Einrichtung',
          deviceTypeCount: 'Geräteanzahl',
          deploymentCount: 'Bereitstellungen',
          viewAll: 'Alle ansehen',
        }

  const recentDeployments = useMemo(
    () => [...deployments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [deployments],
  )

  const activity = useMemo<CareProviderActivityEntry[]>(
    () =>
      careProviders
        .map((careProvider) => {
          const deploymentCount = deployments.filter((deployment) => deployment.careProviderId === careProvider.id).length
          const reportCount = reports.filter((report) => report.careProviderId === careProvider.id).length
          const hasRecordedActivity = deploymentCount > 0 || reportCount > 0
          return {
            careProviderId: careProvider.id,
            name: careProvider.name,
            deployments: hasRecordedActivity ? deploymentCount : stableDemoCount(careProvider.id, 10, 1),
            reports: hasRecordedActivity ? reportCount : stableDemoCount(careProvider.id, 10, 2),
          }
        })
        .sort((a, b) => b.deployments + b.reports - (a.deployments + a.reports)),
    [deployments, reports],
  )

  const activeDeployments = deployments.filter(
    (deployment) => deployment.status !== 'report' && deployment.status !== 'completed',
  ).length
  const memberCount = careProviders.reduce(
    (total, careProvider) =>
      careProvider.id === 'careops-group' ? total : total + (careProvider.members ?? 0),
    0,
  )

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">Administrator · CareOps Gruppe</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-balance sm:text-[32px]">{t.greeting}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.subheading}</p>
        </div>
        <Button
          className="h-11 gap-2 self-start rounded-xl px-4 font-semibold shadow-sm sm:self-auto"
          onClick={openCreateDeployment}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t.createDeployment}
        </Button>
      </div>

      <div className="grid items-stretch gap-5 md:grid-cols-2">
        <DeploymentLocationMap deployments={deployments} language={language} />
        <LatestReports reports={reports} deployments={deployments} language={language} />
      </div>

      <StatsCards
        deployments={deployments.length}
        activeDeployments={activeDeployments}
        reports={reports.length}
        members={memberCount}
      />

      <div className="flex flex-col gap-5">
        <RecentDeploymentsTable
          deployments={recentDeployments.slice(0, 6)}
          title={t.currentDeployments}
          description={t.deploymentDescription}
          deploymentCountLabel={t.deploymentCount}
          deviceTypeCountLabel={t.deviceTypeCount}
          numberLocale={language === 'en' ? 'en' : 'de'}
          showDeploymentMetrics
          deploymentHref={(deployment) => `/deployments/details/${encodeURIComponent(deployment.id)}`}
          action={
            <Link
              href="/deployments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
            >
              {t.viewAll}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />
        <CareProviderActivity activity={activity} />
      </div>

    </div>
  )
}
