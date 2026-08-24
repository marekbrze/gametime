import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CalendarDays, Settings, Star, Trophy } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { path: '/event-calendar', label: 'Kalendarz', icon: CalendarDays },
  { path: '/watchlist', label: 'Obserwowane', icon: Star },
  { path: '/teams', label: 'Drużyny', icon: Trophy },
  { path: '/settings', label: 'Ustawienia', icon: Settings },
] as const

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/event-calendar" className="text-lg font-semibold tracking-tight">
            gametime
          </Link>
          <nav aria-label="Główna nawigacja" className="hidden md:flex md:items-center md:gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                    isActive && 'bg-muted text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {/* Slot na przyszłość: menu użytkownika / strefa czasowa */}
          <div className="hidden md:block" aria-hidden="true" />
        </div>
      </header>

      <main className="container mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      <footer className="mt-auto border-t">
        <div className="container mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4 text-sm text-muted-foreground">
          <span>gametime</span>
          <span aria-hidden="true">·</span>
          {/* Cel pojawi się, gdy data-pipeline dostarczy źródła — do tego czasu tekst, nie martwy link */}
          <span>Źródła danych (wkrótce)</span>
          <span aria-hidden="true">·</span>
          <a
            href="https://github.com/marekbrze"
            className="hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </footer>

      <nav
        aria-label="Nawigacja mobilna"
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background md:hidden"
      >
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2 text-xs font-medium text-muted-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
