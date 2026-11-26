'use client'

import { useT } from '@/components/app-shell'

export function CareProvidersPageHeader() {
  const t = useT()
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-sm font-semibold text-primary">{t('CareOps Gruppe · Einrichtungsverwaltung', 'CareOps Group · Care provider management')}</p>
        <h1 className="text-[28px] font-semibold tracking-tight text-balance sm:text-[32px]">{t('Einrichtungen', 'Care providers')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Einrichtungen, Zuständigkeiten und Mitglieder im Überblick.', 'Care providers, responsibilities and members at a glance.')}
        </p>
      </div>
    </div>
  )
}
