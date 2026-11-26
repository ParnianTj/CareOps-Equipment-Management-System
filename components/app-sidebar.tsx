'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronDown, FileText, FolderKanban, LayoutDashboard, List, UserRound, Building2, UsersRound, Cog, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Language } from '@/components/app-shell'
import { useState } from 'react'

const linkClass =
  'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors'

type AppSidebarProps = {
  language: Language
  collapsed: boolean
  mobileOpen: boolean
  onClose: () => void
  onExpandSidebar: () => void
}

export function AppSidebar({ language, collapsed, mobileOpen, onClose, onExpandSidebar }: AppSidebarProps) {
  const pathname = usePathname()
  const [deploymentsExpanded, setDeploymentsExpanded] = useState(pathname.startsWith('/deployments'))
  const [careProviderManagementExpanded, setCareProviderManagementExpanded] = useState(
    pathname.startsWith('/deployments/care-provider-management'),
  )
  const [medicalDeviceManagementExpanded, setMedicalDeviceManagementExpanded] = useState(
    pathname.startsWith('/medical-device-management'),
  )
  const pageLabel = language === 'de' ? 'Seiten' : 'Pages'
  const settingsLabel = language === 'de' ? 'Einstellungen' : 'Settings'
  const dashboardLabel = language === 'de' ? 'Übersicht' : 'Dashboard'
  const deploymentsLabel = language === 'de' ? 'Bereitstellungen' : 'Deployments'
  const profileLabel = language === 'de' ? 'Profil' : 'Profile'
  const deploymentListLabel = language === 'de' ? 'Bereitstellungsliste' : 'Deployment List'
  const usageRecordsLabel = language === 'de' ? 'Nutzungsdatensätze' : 'Usage records'
  const careProviderManagementLabel = language === 'de' ? 'Einrichtungsverwaltung' : 'Care provider management'
  const careProviderLabel = language === 'de' ? 'Einrichtungen' : 'Care providers'
  const usersLabel = language === 'de' ? 'Benutzer' : 'Users'
  const medicalDeviceManagementLabel = language === 'de' ? 'Medizingeräteverwaltung' : 'Medical device management'
  const medicalDevicesLabel = language === 'de' ? 'Medizingeräte' : 'Medical devices'
  const monitoringDevicesLabel = language === 'de' ? 'Monitoring-/Datenlogger-Geräte' : 'Patient-monitoring / data-logging devices'

  function navigationLinkClass(active: boolean) {
    return cn(
      linkClass,
      collapsed && 'lg:justify-center lg:px-0',
      active
        ? 'bg-sidebar-accent text-white shadow-sm'
        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-white',
    )
  }

  return (
    <aside
      id="app-sidebar"
      className={cn(
        'fixed inset-y-0 left-0 z-[1001] flex h-screen w-[272px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 lg:sticky lg:z-20 lg:translate-x-0',
        collapsed ? 'lg:w-[88px]' : 'lg:w-[272px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <div
        className={cn(
          'flex h-[72px] shrink-0 items-center px-6',
          collapsed && 'lg:justify-center lg:px-2',
        )}
      >
        <Link
          href="/"
          aria-label="CareOps Dashboard"
          onClick={onClose}
          className={cn('inline-flex overflow-hidden rounded-sm', collapsed && 'lg:hidden')}
        >
          <Image src="/careops-logo.svg" alt="CareOps" width={321} height={82} priority className="h-auto w-[168px]" />
        </Link>
        {collapsed && (
          <Link href="/" aria-label="CareOps Dashboard" onClick={onClose} className="hidden lg:inline-flex">
            <Image src="/careops-logo.svg" alt="CareOps" width={321} height={82} className="h-auto w-[60px]" />
          </Link>
        )}
      </div>

      <nav aria-label={language === 'de' ? 'Hauptnavigation' : 'Main navigation'} className="sidebar-navigation flex-1 overflow-y-auto px-4 py-7">
        <p className={cn('px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45', collapsed && 'lg:hidden')}>
          {pageLabel}
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          <li>
            <Link
              href="/"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={navigationLinkClass(pathname === '/')}
              title={collapsed ? dashboardLabel : undefined}
              onClick={onClose}
            >
              <LayoutDashboard className="size-[18px] shrink-0" aria-hidden="true" />
              <span className={cn(collapsed && 'lg:hidden')}>{dashboardLabel}</span>
            </Link>
          </li>
          <li>
            <button
              type="button"
              aria-expanded={deploymentsExpanded}
              aria-controls="deployment-subcategories"
              className={cn(navigationLinkClass(pathname.startsWith('/deployments')), 'w-full')}
              title={collapsed ? deploymentsLabel : undefined}
              onClick={() => {
                if (collapsed) onExpandSidebar()
                setDeploymentsExpanded((expanded) => !expanded)
              }}
            >
              <FolderKanban className="size-[18px] shrink-0" aria-hidden="true" />
              <span className={cn('flex-1 text-left', collapsed && 'lg:hidden')}>{deploymentsLabel}</span>
              <ChevronDown
                className={cn('size-4 shrink-0 transition-transform', deploymentsExpanded && 'rotate-180', collapsed && 'lg:hidden')}
                aria-hidden="true"
              />
            </button>
            {deploymentsExpanded && !collapsed && (
              <ul id="deployment-subcategories" className="mt-1 ml-4 flex flex-col gap-1 border-l border-sidebar-border pl-3">
                <li>
                  <Link
                    href="/deployments/list"
                    aria-current={pathname === '/deployments/list' ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/deployments/list'
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white',
                    )}
                    onClick={onClose}
                  >
                    <List className="size-4 shrink-0" aria-hidden="true" />
                    {deploymentListLabel}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/deployments/usage-records"
                    aria-current={pathname === '/deployments/usage-records' ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/deployments/usage-records'
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white',
                    )}
                    onClick={onClose}
                  >
                    <FileText className="size-4 shrink-0" aria-hidden="true" />
                    {usageRecordsLabel}
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <button
              type="button"
              aria-expanded={medicalDeviceManagementExpanded}
              aria-controls="medical-device-management-subcategories"
              className={cn(
                navigationLinkClass(pathname.startsWith('/medical-device-management')),
                'w-full',
              )}
              title={collapsed ? medicalDeviceManagementLabel : undefined}
              onClick={() => {
                if (collapsed) onExpandSidebar()
                setMedicalDeviceManagementExpanded((expanded) => !expanded)
              }}
            >
              <Cog className="size-[18px] shrink-0" aria-hidden="true" />
              <span className={cn('flex-1 text-left', collapsed && 'lg:hidden')}>{medicalDeviceManagementLabel}</span>
              <ChevronDown
                className={cn('size-4 shrink-0 transition-transform', medicalDeviceManagementExpanded && 'rotate-180', collapsed && 'lg:hidden')}
                aria-hidden="true"
              />
            </button>
            {medicalDeviceManagementExpanded && !collapsed && (
              <ul id="medical-device-management-subcategories" className="mt-1 ml-4 flex flex-col gap-1 border-l border-sidebar-border pl-3">
                <li>
                  <Link
                    href="/medical-device-management/medical-devices"
                    aria-current={pathname === '/medical-device-management/medical-devices' ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/medical-device-management/medical-devices'
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white',
                    )}
                    onClick={onClose}
                  >
                    <Cog className="size-4 shrink-0" aria-hidden="true" />
                    {medicalDevicesLabel}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/medical-device-management/monitoring-devices"
                    aria-current={pathname === '/medical-device-management/monitoring-devices' ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/medical-device-management/monitoring-devices'
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white',
                    )}
                    onClick={onClose}
                  >
                    <Radio className="size-4 shrink-0" aria-hidden="true" />
                    {monitoringDevicesLabel}
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <button
              type="button"
              aria-expanded={careProviderManagementExpanded}
              aria-controls="care-provider-management-subcategories"
              className={cn(
                navigationLinkClass(pathname.startsWith('/deployments/care-provider-management')),
                'w-full',
              )}
              title={collapsed ? careProviderManagementLabel : undefined}
              onClick={() => {
                if (collapsed) onExpandSidebar()
                setCareProviderManagementExpanded((expanded) => !expanded)
              }}
            >
              <Building2 className="size-[18px] shrink-0" aria-hidden="true" />
              <span className={cn('flex-1 text-left', collapsed && 'lg:hidden')}>{careProviderManagementLabel}</span>
              <ChevronDown
                className={cn('size-4 shrink-0 transition-transform', careProviderManagementExpanded && 'rotate-180', collapsed && 'lg:hidden')}
                aria-hidden="true"
              />
            </button>
            {careProviderManagementExpanded && !collapsed && (
              <ul id="care-provider-management-subcategories" className="mt-1 ml-4 flex flex-col gap-1 border-l border-sidebar-border pl-3">
                <li>
                  <Link
                    href="/deployments/care-provider-management/care-providers"
                    aria-current={pathname === '/deployments/care-provider-management/care-providers' ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/deployments/care-provider-management/care-providers'
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white',
                    )}
                    onClick={onClose}
                  >
                    <Building2 className="size-4 shrink-0" aria-hidden="true" />
                    {careProviderLabel}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/deployments/care-provider-management/users"
                    aria-current={pathname === '/deployments/care-provider-management/users' ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/deployments/care-provider-management/users'
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white',
                    )}
                    onClick={onClose}
                  >
                    <UsersRound className="size-4 shrink-0" aria-hidden="true" />
                    {usersLabel}
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>

        <p className={cn('mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45', collapsed && 'lg:hidden')}>
          {settingsLabel}
        </p>
        <ul className="mt-3">
          <li>
            <Link
              href="/profile"
              aria-current={pathname.startsWith('/profile') ? 'page' : undefined}
              className={navigationLinkClass(pathname.startsWith('/profile'))}
              title={collapsed ? profileLabel : undefined}
              onClick={onClose}
            >
              <UserRound className="size-[18px] shrink-0" aria-hidden="true" />
              <span className={cn(collapsed && 'lg:hidden')}>{profileLabel}</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
        <div className={cn('flex items-center gap-2.5', collapsed && 'lg:justify-center')}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e7ecf2] text-xs font-semibold text-[#17365d]">
            AB
          </span>
          <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <p className="truncate text-xs font-medium text-sidebar-foreground/80">Alex Berger</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
