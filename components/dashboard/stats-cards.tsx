import { Activity, Building2, FileCheck2, FolderKanban, type LucideIcon } from 'lucide-react'

type Tone = 'navy' | 'gray' | 'red' | 'slate'
type Stat = { label: string; value: number; hint: string; icon: LucideIcon; tone: Tone }

type StatsCardsProps = {
  projects: number
  activeProjects: number
  reports: number
  members: number
}

export function StatsCards({ projects, activeProjects, reports, members }: StatsCardsProps) {
  const stats: Stat[] = [
    { label: 'Projekte gesamt', value: projects, hint: 'In allen Bereichen', icon: FolderKanban, tone: 'navy' },
    { label: 'In Bearbeitung', value: activeProjects, hint: 'Noch nicht abgeschlossen', icon: Activity, tone: 'gray' },
    { label: 'Berichte', value: reports, hint: 'Erstellte Abschlussberichte', icon: FileCheck2, tone: 'red' },
    { label: 'Mitglieder', value: members, hint: 'Über alle Organisationen', icon: Building2, tone: 'slate' },
  ]

  const tones = {
    navy: 'bg-[#e8edf4] text-[#17365d] dark:bg-[#293b54] dark:text-[#c3d1e2]',
    gray: 'bg-[#edf0f4] text-[#596579] dark:bg-[#303b4c] dark:text-[#c0c8d3]',
    red: 'bg-[#f4e9eb] text-[#842737] dark:bg-[#482b36] dark:text-[#dfadb5]',
    slate: 'bg-[#eaedf1] text-[#596579] dark:bg-[#303b4c] dark:text-[#c0c8d3]',
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {stats.map((stat) => (
        <li
          key={stat.label}
          className="rounded-2xl border border-border/80 bg-card p-4 shadow-[0_2px_12px_rgba(23,42,50,0.025)] sm:p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-[13px] font-medium text-muted-foreground">{stat.label}</span>
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tones[stat.tone]}`}>
              <stat.icon className="size-[17px]" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-[28px] font-semibold leading-none tracking-tight tabular-nums">{stat.value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{stat.hint}</p>
        </li>
      ))}
    </ul>
  )
}
