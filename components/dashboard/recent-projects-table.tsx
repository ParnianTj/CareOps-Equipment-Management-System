import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Panel } from './panel'
import { StatusBadge } from './status-badge'
import { formatDateTime, getOrgName, type Project } from '@/lib/dashboard-data'

type RecentProjectsTableProps = {
  projects: Project[]
  title?: string
  description?: string
  emptyMessage?: string
  action?: React.ReactNode
  projectCountLabel?: string
  screwCountLabel?: string
  numberLocale?: string
  showProjectMetrics?: boolean
  scrollable?: boolean
  projectHref?: (project: Project) => string
  onEditProject?: (project: Project) => void
  onDeleteProject?: (project: Project) => void
}

export function RecentProjectsTable({
  projects,
  title = 'Aktuelle Projekte',
  description = 'Die zuletzt erstellten Projekte',
  emptyMessage = 'Keine Projekte gefunden.',
  action,
  projectCountLabel = 'Projekte',
  screwCountLabel = 'Schrauben',
  numberLocale = 'de',
  showProjectMetrics = false,
  scrollable = true,
  projectHref,
  onEditProject,
  onDeleteProject,
}: RecentProjectsTableProps) {
  const showActions = Boolean(onEditProject || onDeleteProject)
  const columnCount = 5 + (showProjectMetrics ? 1 : 0) + (showActions ? 1 : 0)

  return (
    <Panel
      title={title}
      description={description}
      action={
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
            {projects.length} {projectCountLabel}
          </span>
          {action}
        </div>
      }
    >
      <div className={scrollable ? 'max-h-[440px] overflow-y-auto' : ''}>
        <table className="w-full table-fixed text-[10px] sm:text-xs xl:text-sm">
          <colgroup>
            <col className={showActions ? 'w-[20%]' : 'w-[25%]'} />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            {showProjectMetrics && <col className="w-[10%]" />}
            <col className="w-[12%]" />
            <col className={showActions ? 'w-[16%]' : 'w-[15%]'} />
            {showActions && <col className="w-[10%]" />}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="border-y border-border bg-muted text-left text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px] xl:text-xs">
              <th scope="col" className="break-words px-1 py-2 sm:px-2 sm:py-3">Projekt</th>
              <th scope="col" className="break-words px-1 py-2 sm:px-2 sm:py-3">Organisation</th>
              <th scope="col" className="break-words px-1 py-2 sm:px-2 sm:py-3">Status</th>
              {showProjectMetrics && (
                <th scope="col" className="break-words px-1 py-2 text-right sm:px-2 sm:py-3">{screwCountLabel}</th>
              )}
              <th scope="col" className="break-words px-1 py-2 sm:px-2 sm:py-3">Erstellt von</th>
              <th scope="col" className="break-words px-1 py-2 text-right sm:px-2 sm:py-3">Erstellt am</th>
              {showActions && <th scope="col" className="break-words px-1 py-2 text-center sm:px-2 sm:py-3">Aktionen</th>}
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-border last:border-0 hover:bg-muted/60">
                <td className="break-words px-1 py-2 sm:px-2 sm:py-3.5">
                  {projectHref ? (
                    <Link
                      href={projectHref(project)}
                      className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <p className="break-words font-medium group-hover:text-primary group-hover:underline">{project.name}</p>
                      <p className="break-words text-muted-foreground">{project.location}</p>
                    </Link>
                  ) : (
                    <>
                      <p className="break-words font-medium">{project.name}</p>
                      <p className="break-words text-muted-foreground">{project.location}</p>
                    </>
                  )}
                </td>
                <td className="break-words px-1 py-2 text-muted-foreground sm:px-2 sm:py-3.5">{getOrgName(project.orgId)}</td>
                <td className="break-words px-1 py-2 sm:px-2 sm:py-3.5">
                  <StatusBadge status={project.status} />
                </td>
                {showProjectMetrics && (
                  <td className="break-words px-1 py-2 text-right tabular-nums sm:px-2 sm:py-3.5">
                    {(project.positions ?? []).reduce((total, position) => total + position.quantity, 0).toLocaleString(numberLocale)}
                  </td>
                )}
                <td className="break-words px-1 py-2 text-muted-foreground sm:px-2 sm:py-3.5">{project.createdBy}</td>
                <td className="break-words px-1 py-2 text-right tabular-nums text-muted-foreground sm:px-2 sm:py-3.5">
                  <time dateTime={project.createdAt}>{formatDateTime(project.createdAt)}</time>
                </td>
                {showActions && (
                  <td className="px-0.5 py-1 sm:px-1 sm:py-2">
                    <div className="flex flex-col items-center justify-center gap-0.5 xl:flex-row xl:gap-1">
                      {onEditProject && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 xl:size-8"
                          aria-label={`Projekt ${project.name} bearbeiten`}
                          title="Bearbeiten"
                          onClick={() => onEditProject(project)}
                        >
                          <Pencil className="size-3.5 xl:size-4" aria-hidden="true" />
                        </Button>
                      )}
                      {onDeleteProject && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Projekt ${project.name} löschen`}
                          title="Löschen"
                          className="size-7 text-destructive hover:text-destructive xl:size-8"
                          onClick={() => onDeleteProject(project)}
                        >
                          <Trash2 className="size-3.5 xl:size-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-2 py-10 text-center text-xs text-muted-foreground sm:text-sm">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
