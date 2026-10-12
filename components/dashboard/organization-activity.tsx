import { Panel } from './panel'

export type OrgActivity = {
  orgId: string
  name: string
  projects: number
  reports: number
}

export function OrganizationActivity({ activity }: { activity: OrgActivity[] }) {
  const max = Math.max(1, ...activity.map((item) => item.projects + item.reports))

  return (
    <Panel
      title="Aktivität nach Organisation"
      description="Projekte und Berichte im gesamten Netzwerk"
      action={
        <div className="flex shrink-0 flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-chart-1" aria-hidden="true" />
            Projekte
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-chart-2" aria-hidden="true" />
            Berichte
          </span>
        </div>
      }
    >
      <ul className="flex flex-col gap-4 px-5 pb-5">
        {activity.map((item) => {
          const total = item.projects + item.reports
          return (
            <li key={item.orgId}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{item.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {total === 0 ? (
                    'Keine Aktivität'
                  ) : (
                    <>
                      <span className="sr-only">{`${item.projects} Projekte und ${item.reports} Berichte`}</span>
                      <span aria-hidden="true">
                        {item.projects}P &middot; {item.reports}B
                      </span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full bg-chart-1" style={{ width: `${(item.projects / max) * 100}%` }} />
                <div className="h-full bg-chart-2" style={{ width: `${(item.reports / max) * 100}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
