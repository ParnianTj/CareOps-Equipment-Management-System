import Link from 'next/link'
import { Panel } from './panel'
import { formatDateTime, getOrgName, type Project, type Report } from '@/lib/dashboard-data'
import type { Language } from '@/components/app-shell'

export function LatestReports({
  reports,
  projects,
  language = 'de',
}: {
  reports: Report[]
  projects: Project[]
  language?: Language
}) {
  const isEnglish = language === 'en'
  const latestReports = [...reports]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <Panel
      title={isEnglish ? 'Latest reports' : 'Neueste Berichte'}
      description={
        isEnglish
          ? 'The five most recently created reports'
          : 'Die fünf zuletzt erstellten Berichte'
      }
      action={
        <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
          {latestReports.length}
        </span>
      }
      className="h-full"
    >
      <ol className="flex h-full flex-col justify-center gap-5 px-5 pb-5 sm:gap-6 sm:px-6">
        {latestReports.map((report, index) => {
          const project = projects.find(
            (item) => item.id === report.projectId || (item.name === report.projectName && item.orgId === report.orgId),
          )
          const title = report.reportName ?? report.projectName
          const projectName = project ? (
            <Link
              href={`/projekte/details/${encodeURIComponent(project.id)}`}
              className="block truncate font-medium text-foreground hover:text-primary"
            >
              {title}
            </Link>
          ) : (
            <span className="block truncate font-medium text-foreground">{title}</span>
          )

          return (
            <li key={report.id} className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                {projectName}
                <p className="truncate text-sm text-muted-foreground">{getOrgName(report.orgId)}</p>
              </div>
              <time
                dateTime={report.createdAt}
                className="hidden shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block"
              >
                {formatDateTime(report.createdAt)}
              </time>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
