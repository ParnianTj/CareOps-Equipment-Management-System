import { statusLabels, type ProjectStatus } from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'

const dotClass: Record<ProjectStatus, string> = {
  created: 'bg-[#315b8a]',
  datasets: 'bg-[#8792a2]',
  report: 'bg-[#842737]',
  completed: 'bg-[#2f7a58]',
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-muted px-1.5 py-1 text-[9px] font-medium leading-tight sm:gap-1.5 sm:px-2.5 sm:text-xs">
      <span className={cn('size-2 shrink-0 rounded-full', dotClass[status])} aria-hidden="true" />
      {statusLabels[status]}
    </span>
  )
}
