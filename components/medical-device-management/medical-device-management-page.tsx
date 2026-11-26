'use client'

import { Cog } from 'lucide-react'
import { useT } from '@/components/app-shell'

type MedicalDeviceManagementPageProps = {
  title: string
  description: string
  emptyMessage: string
}

export function MedicalDeviceManagementPage({
  title,
  description,
  emptyMessage,
}: MedicalDeviceManagementPageProps) {
  const t = useT()
  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
      <header>
        <p className="mb-2 text-sm font-semibold text-primary">{t('Medizingeräteverwaltung', 'Medical device management')}</p>
        <h1 className="text-[28px] font-semibold tracking-tight text-balance sm:text-[32px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>
      <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-border/80 bg-card px-5 py-10 text-center shadow-[0_2px_12px_rgba(23,42,50,0.025)]">
        <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
          <Cog className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-base font-semibold">{title}</h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">{emptyMessage}</p>
      </section>
    </div>
  )
}
