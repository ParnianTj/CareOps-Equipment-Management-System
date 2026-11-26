'use client'

import { useT } from '@/components/app-shell'
import { Panel } from './panel'

export type CareProviderActivityEntry = {
  careProviderId: string
  name: string
  deployments: number
  reports: number
}

export function CareProviderActivity({ activity }: { activity: CareProviderActivityEntry[] }) {
  const t = useT()
  const max = Math.max(1, ...activity.map((item) => item.deployments + item.reports))

  return (
    <Panel
      title={t('Aktivität nach Einrichtung', 'Activity by care provider')}
      description={t('Bereitstellungen und Berichte im gesamten Netzwerk', 'Deployments and reports across the network')}
      action={
        <div className="flex shrink-0 flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-chart-1" aria-hidden="true" />
            {t('Bereitstellungen', 'Deployments')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-chart-2" aria-hidden="true" />
            {t('Berichte', 'Reports')}
          </span>
        </div>
      }
    >
      <ul className="flex flex-col gap-4 px-5 pb-5">
        {activity.map((item) => {
          const total = item.deployments + item.reports
          return (
            <li key={item.careProviderId}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{item.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {total === 0 ? (
                    t('Keine Aktivität', 'No activity')
                  ) : (
                    <>
                      <span className="sr-only">{t(`${item.deployments} Bereitstellungen und ${item.reports} Berichte`, `${item.deployments} deployments and ${item.reports} reports`)}</span>
                      <span aria-hidden="true">
                        {item.deployments}{t(' Bst.', 'D')} &middot; {item.reports}{t(' Ber.', 'R')}
                      </span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full bg-chart-1" style={{ width: `${(item.deployments / max) * 100}%` }} />
                <div className="h-full bg-chart-2" style={{ width: `${(item.reports / max) * 100}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
