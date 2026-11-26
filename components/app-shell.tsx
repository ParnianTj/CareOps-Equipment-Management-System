'use client'

import { cloneElement, createContext, isValidElement, useCallback, useContext, useMemo, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { TopHeader } from '@/components/top-header'

export type Language = 'de' | 'en'

const LanguageContext = createContext<{
  language: Language
  setLanguage: (language: Language) => void
} | null>(null)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}

/** Returns t(german, english), which picks the text for the current UI language. */
export function useT() {
  const { language } = useLanguage()
  return useCallback((de: string, en: string) => (language === 'en' ? en : de), [language])
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('de')
  const value = useMemo(() => ({ language, setLanguage }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { language, setLanguage } = useLanguage()

  const content = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ language?: Language }>, { language })
    : children

  return (
    <div className="min-h-screen min-w-0 bg-background lg:flex">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label={language === 'de' ? 'Navigation schließen' : 'Close navigation'}
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-[1000] bg-black/45 backdrop-blur-[2px] lg:hidden"
        />
      )}
      {!mobileSidebarOpen && (
        <button
          type="button"
          aria-label={language === 'de' ? 'Navigation öffnen' : 'Open navigation'}
          aria-controls="app-sidebar"
          aria-expanded={false}
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed inset-y-0 left-0 z-[1000] flex w-3.5 items-center justify-center border-r border-sidebar-border bg-sidebar lg:hidden"
        >
          <span className="h-12 w-0.5 rounded-full bg-sidebar-foreground/40" aria-hidden="true" />
        </button>
      )}
      <AppSidebar
        language={language}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onExpandSidebar={() => setSidebarCollapsed(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopHeader
          language={language}
          onLanguageChange={setLanguage}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1 overflow-x-clip px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">{content}</main>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-[72px] z-[45] border-t border-border/80"
      />
    </div>
  )
}
