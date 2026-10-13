'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronDown, FileText, FolderKanban, LayoutDashboard, List, UserRound, Building2, UsersRound } from 'lucide-react'
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
  const [projectsExpanded, setProjectsExpanded] = useState(pathname.startsWith('/projekte'))
  const [organizationManagementExpanded, setOrganizationManagementExpanded] = useState(
    pathname.startsWith('/projekte/organisation-management'),
  )
  const pageLabel = language === 'de' ? 'Seiten' : 'Pages'
  const settingsLabel = language === 'de' ? 'Einstellungen' : 'Settings'
  const dashboardLabel = language === 'de' ? 'Übersicht' : 'Dashboard'
  const projectsLabel = language === 'de' ? 'Projekte' : 'Projects'
  const profileLabel = language === 'de' ? 'Profil' : 'Profile'
  const projectListLabel = language === 'de' ? 'Projektliste' : 'Project List'
  const datasetsLabel = language === 'de' ? 'Datensätze' : 'Datasets'
  const organizationManagementLabel = language === 'de' ? 'Organisationsverwaltung' : 'Organisation management'
  const organizationLabel = language === 'de' ? 'Organisation' : 'Organisation'
  const usersLabel = language === 'de' ? 'Benutzer' : 'Users'

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
          aria-label="KRINNER Dashboard"
          onClick={onClose}
          className={cn('inline-flex overflow-hidden rounded-sm', collapsed && 'lg:hidden')}
        >
          <Image src="/krinner-logo.png" alt="KRINNER" width={321} height={82} priority className="h-auto w-[168px]" />
        </Link>
        {collapsed && (
          <Link href="/" aria-label="KRINNER Dashboard" onClick={onClose} className="hidden lg:inline-flex">
            <Image src="/krinner-logo.png" alt="KRINNER" width={321} height={82} className="h-auto w-[60px]" />
          </Link>
        )}
      </div>

      <nav aria-label="Main navigation" className="sidebar-navigation flex-1 overflow-y-auto px-4 py-7">
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
              aria-expanded={projectsExpanded}
              aria-controls="project-subcategories"
              className={cn(navigationLinkClass(pathname.startsWith('/projekte')), 'w-full')}
              title={collapsed ? projectsLabel : undefined}
              onClick={() => {
                if (collapsed) onExpandSidebar()
                setProjectsExpanded((expanded) => !expanded)
              }}
            >
              <FolderKanban className="size-[18px] shrink-0" aria-hidden="true" />
              <span className={cn('flex-1 text-left', collapsed && 'lg:hidden')}>{projectsLabel}</span>
              <ChevronDown
                className={cn('size-4 shrink-0 transition-transform', projectsExpanded && 'rotate-180', collapsed && 'lg:hidden')}
                aria-hidden="true"
              />
            </button>
            {projectsExpanded && !collapsed && (
              <ul id="project-subcategories" className="mt-1 ml-4 flex flex-col gap-1 border-l border-sidebar-border pl-3">
                <li>
                  <Link
                    href="/projekte/liste"
                    aria-current={pathname === '/projekte/liste' ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/projekte/liste'
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white',
                    )}
                    onClick={onClose}
                  >
                    <List className="size-4 shrink-0" aria-hidden="true" />
                    {projectListLabel}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/projekte/datensaetze"
                    aria-current={pathname === '/projekte/datensaetze' ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/projekte/datensaetze'
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white',
                    )}
                    onClick={onClose}
                  >
                    <FileText className="size-4 shrink-0" aria-hidden="true" />
                    {datasetsLabel}
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <button
              type="button"
              aria-expanded={organizationManagementExpanded}
              aria-controls="organization-management-subcategories"
              className={cn(
                navigationLinkClass(pathname.startsWith('/projekte/organisation-management')),
                'w-full',
              )}
              title={collapsed ? organizationManagementLabel : undefined}
              onClick={() => {
                if (collapsed) onExpandSidebar()
                setOrganizationManagementExpanded((expanded) => !expanded)
              }}
            >
              <Building2 className="size-[18px] shrink-0" aria-hidden="true" />
              <span className={cn('flex-1 text-left', collapsed && 'lg:hidden')}>{organizationManagementLabel}</span>
              <ChevronDown
                className={cn('size-4 shrink-0 transition-transform', organizationManagementExpanded && 'rotate-180', collapsed && 'lg:hidden')}
                aria-hidden="true"
              />
            </button>
            {organizationManagementExpanded && !collapsed && (
              <ul id="organization-management-subcategories" className="mt-1 ml-4 flex flex-col gap-1 border-l border-sidebar-border pl-3">
                <li>
                  <Link
                    href="/projekte/organisation-management/organisation"
                    aria-current={pathname === '/projekte/organisation-management/organisation' ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/projekte/organisation-management/organisation'
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white',
                    )}
                    onClick={onClose}
                  >
                    <Building2 className="size-4 shrink-0" aria-hidden="true" />
                    {organizationLabel}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/projekte/organisation-management/benutzer"
                    aria-current={pathname === '/projekte/organisation-management/benutzer' ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/projekte/organisation-management/benutzer'
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
            DZ
          </span>
          <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <p className="truncate text-xs font-medium text-sidebar-foreground/80">Dominik Züger</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
