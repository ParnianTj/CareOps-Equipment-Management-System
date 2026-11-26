'use client'

import { FolderPlus } from 'lucide-react'
import { useT } from '@/components/app-shell'
import { Panel } from './panel'
import { StatusBadge } from './status-badge'
import { formatDateTime, getCareProviderName, type Deployment } from '@/lib/dashboard-data'

export function LatestDeployments({ deployments }: { deployments: Deployment[] }) {
  const t = useT()
  return (
    <Panel title={t('Zuletzt erstellte Bereitstellungen', 'Latest created deployments')} description={t('Die 5 zuletzt erstellten Bereitstellungen', 'The 5 most recently created deployments')}>
      <ol className="flex flex-col px-2 pb-3">
        {deployments.map((deployment, index) => (
          <li
            key={deployment.id}
            className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              {index === 0 ? <FolderPlus className="size-4" aria-label={t('Neueste', 'Newest')} /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{deployment.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {getCareProviderName(deployment.careProviderId)} &middot; {deployment.location}
              </p>
            </div>
            <div className="hidden flex-col items-end gap-1 sm:flex">
              <StatusBadge status={deployment.status} />
              <time dateTime={deployment.createdAt} className="text-xs tabular-nums text-muted-foreground">
                {formatDateTime(deployment.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
