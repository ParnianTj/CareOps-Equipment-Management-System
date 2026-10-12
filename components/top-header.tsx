'use client'

import { Menu, PanelLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import type { Language } from '@/components/app-shell'

type TopHeaderProps = {
  language: Language
  onLanguageChange: (language: Language) => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onOpenMobileSidebar: () => void
}

export function TopHeader({
  language,
  onLanguageChange,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
}: TopHeaderProps) {
  const navigationLabel = language === 'de' ? 'Admin-Bereich' : 'Administration'
  const sidebarToggleLabel = sidebarCollapsed ? (language === 'de' ? 'Seitenleiste erweitern' : 'Expand sidebar') : language === 'de' ? 'Seitenleiste reduzieren' : 'Collapse sidebar'

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between bg-background/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
      <div className="flex min-w-0 items-center gap-5">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label={language === 'de' ? 'Navigation öffnen' : 'Open navigation'}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarToggleLabel}
          title={sidebarToggleLabel}
          className="hidden size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
        >
          <PanelLeft className="size-[18px]" aria-hidden="true" />
        </button>
        <p className="hidden text-sm font-medium text-muted-foreground sm:block">
          Z-part group <span className="mx-2 text-border">/</span> {navigationLabel}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <div className="inline-flex items-center rounded-lg border border-border bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => onLanguageChange('de')}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              language === 'de' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={language === 'de'}
            aria-label="Sprache auf Deutsch einstellen"
          >
            DE
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              language === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={language === 'en'}
            aria-label="Set language to English"
          >
            EN
          </button>
        </div>
        <ThemeToggle />
        <span className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            DZ
          </span>
          <span className="hidden flex-col md:flex">
            <span className="text-sm font-semibold leading-5">Dominik Züger</span>
            <span className="text-xs text-muted-foreground">Administrator</span>
          </span>
        </div>
      </div>
    </header>
  )
}
