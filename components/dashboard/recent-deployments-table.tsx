'use client'

import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { useLanguage, useT } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Panel } from './panel'
import { StatusBadge } from './status-badge'
import { formatDateTime, getCareProviderName, type Deployment } from '@/lib/dashboard-data'

type RecentDeploymentsTableProps = {
  deployments: Deployment[]
  title?: string
  description?: string
  emptyMessage?: string
  action?: React.ReactNode
  deploymentCountLabel?: string
  deviceTypeCountLabel?: string
  numberLocale?: string
  showDeploymentMetrics?: boolean
  scrollable?: boolean
  deploymentHref?: (deployment: Deployment) => string
  onEditDeployment?: (deployment: Deployment) => void
  onDeleteDeployment?: (deployment: Deployment) => void
}

export function RecentDeploymentsTable({
  deployments,
  title: titleProp,
  description: descriptionProp,
  emptyMessage: emptyMessageProp,
  action,
  deploymentCountLabel: deploymentCountLabelProp,
  deviceTypeCountLabel: deviceTypeCountLabelProp,
  numberLocale: numberLocaleProp,
  showDeploymentMetrics = false,
  scrollable = true,
  deploymentHref,
  onEditDeployment,
  onDeleteDeployment,
}: RecentDeploymentsTableProps) {
  const t = useT()
  const { language } = useLanguage()
  const title = titleProp ?? t('Aktuelle Bereitstellungen', 'Recent deployments')
  const description = descriptionProp ?? t('Die zuletzt erstellten Bereitstellungen', 'The most recently created deployments')
  const emptyMessage = emptyMessageProp ?? t('Keine Bereitstellungen gefunden.', 'No deployments found.')
  const deploymentCountLabel = deploymentCountLabelProp ?? t('Bereitstellungen', 'Deployments')
  const deviceTypeCountLabel = deviceTypeCountLabelProp ?? t('Gerätetypen', 'Device types')
  const numberLocale = numberLocaleProp ?? (language === 'en' ? 'en' : 'de')
  const showActions = Boolean(onEditDeployment || onDeleteDeployment)
  const columnCount = 5 + (showDeploymentMetrics ? 1 : 0) + (showActions ? 1 : 0)

  return (
    <Panel
      title={title}
      description={description}
      action={
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
            {deployments.length} {deploymentCountLabel}
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
            {showDeploymentMetrics && <col className="w-[10%]" />}
            <col className="w-[12%]" />
            <col className={showActions ? 'w-[16%]' : 'w-[15%]'} />
            {showActions && <col className="w-[10%]" />}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="border-y border-border bg-muted text-left text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px] xl:text-xs">
              <th scope="col" className="break-words px-1 py-2 sm:px-2 sm:py-3">{t('Bereitstellung', 'Deployment')}</th>
              <th scope="col" className="break-words px-1 py-2 sm:px-2 sm:py-3">{t('Einrichtung', 'Care provider')}</th>
              <th scope="col" className="break-words px-1 py-2 sm:px-2 sm:py-3">Status</th>
              {showDeploymentMetrics && (
                <th scope="col" className="break-words px-1 py-2 text-right sm:px-2 sm:py-3">{deviceTypeCountLabel}</th>
              )}
              <th scope="col" className="break-words px-1 py-2 sm:px-2 sm:py-3">{t('Erstellt von', 'Created by')}</th>
              <th scope="col" className="break-words px-1 py-2 text-right sm:px-2 sm:py-3">{t('Erstellt am', 'Created on')}</th>
              {showActions && <th scope="col" className="break-words px-1 py-2 text-center sm:px-2 sm:py-3">{t('Aktionen', 'Actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {deployments.map((deployment) => (
              <tr key={deployment.id} className="border-b border-border last:border-0 hover:bg-muted/60">
                <td className="break-words px-1 py-2 sm:px-2 sm:py-3.5">
                  {deploymentHref ? (
                    <Link
                      href={deploymentHref(deployment)}
                      className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <p className="break-words font-medium group-hover:text-primary group-hover:underline">{deployment.name}</p>
                      <p className="break-words text-muted-foreground">{deployment.location}</p>
                    </Link>
                  ) : (
                    <>
                      <p className="break-words font-medium">{deployment.name}</p>
                      <p className="break-words text-muted-foreground">{deployment.location}</p>
                    </>
                  )}
                </td>
                <td className="break-words px-1 py-2 text-muted-foreground sm:px-2 sm:py-3.5">{getCareProviderName(deployment.careProviderId)}</td>
                <td className="break-words px-1 py-2 sm:px-2 sm:py-3.5">
                  <StatusBadge status={deployment.status} />
                </td>
                {showDeploymentMetrics && (
                  <td className="break-words px-1 py-2 text-right tabular-nums sm:px-2 sm:py-3.5">
                    {(deployment.lineItems ?? []).reduce((total, lineItem) => total + lineItem.quantity, 0).toLocaleString(numberLocale)}
                  </td>
                )}
                <td className="break-words px-1 py-2 text-muted-foreground sm:px-2 sm:py-3.5">{deployment.createdBy}</td>
                <td className="break-words px-1 py-2 text-right tabular-nums text-muted-foreground sm:px-2 sm:py-3.5">
                  <time dateTime={deployment.createdAt}>{formatDateTime(deployment.createdAt)}</time>
                </td>
                {showActions && (
                  <td className="px-0.5 py-1 sm:px-1 sm:py-2">
                    <div className="flex flex-col items-center justify-center gap-0.5 xl:flex-row xl:gap-1">
                      {onEditDeployment && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 xl:size-8"
                          aria-label={t(`Bereitstellung ${deployment.name} bearbeiten`, `Edit deployment ${deployment.name}`)}
                          title={t('Bearbeiten', 'Edit')}
                          onClick={() => onEditDeployment(deployment)}
                        >
                          <Pencil className="size-3.5 xl:size-4" aria-hidden="true" />
                        </Button>
                      )}
                      {onDeleteDeployment && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t(`Bereitstellung ${deployment.name} löschen`, `Delete deployment ${deployment.name}`)}
                          title={t('Löschen', 'Delete')}
                          className="size-7 text-destructive hover:text-destructive xl:size-8"
                          onClick={() => onDeleteDeployment(deployment)}
                        >
                          <Trash2 className="size-3.5 xl:size-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {deployments.length === 0 && (
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
