import { FolderPlus } from 'lucide-react'
import { Panel } from './panel'
import { StatusBadge } from './status-badge'
import { formatDateTime, getOrgName, type Project } from '@/lib/dashboard-data'

export function LatestProjects({ projects }: { projects: Project[] }) {
  return (
    <Panel title="Latest created projects" description="The 5 most recently created projects">
      <ol className="flex flex-col px-2 pb-3">
        {projects.map((project, index) => (
          <li
            key={project.id}
            className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              {index === 0 ? <FolderPlus className="size-4" aria-label="Newest" /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{project.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {getOrgName(project.orgId)} &middot; {project.location}
              </p>
            </div>
            <div className="hidden flex-col items-end gap-1 sm:flex">
              <StatusBadge status={project.status} />
              <time dateTime={project.createdAt} className="text-xs tabular-nums text-muted-foreground">
                {formatDateTime(project.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
