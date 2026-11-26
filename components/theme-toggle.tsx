'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

const subscribe = () => () => {}

export function ThemeToggle({ dark = false }: { dark?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  // false during server render and hydration, true afterwards on the client
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dark ? 'border-[#35415a] bg-[#151f33] text-[#e7ebf3] hover:bg-[#293550]' : 'border-border bg-card text-foreground hover:bg-muted'}`}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
    >
      {isDark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}
