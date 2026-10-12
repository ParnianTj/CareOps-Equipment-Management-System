import { cn } from '@/lib/utils'

type PanelProps = {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function Panel({ title, description, action, className, children }: PanelProps) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col rounded-2xl border border-border/80 bg-card text-card-foreground shadow-[0_2px_12px_rgba(23,42,50,0.025)]',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">{description}</p>}
        </div>
        {action}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  )
}
