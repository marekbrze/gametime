import { useEffect, useRef, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, Settings, Star, Trophy } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { path: '/event-calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/watchlist', label: 'Watchlist', icon: Star },
  { path: '/teams', label: 'Teams', icon: Trophy },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const

/**
 * Zapamiętany ostatni query kalendarza (filtry + tydzień, ADR-0014) — wraca
 * z taby Calendar po powrocie z innej taby. Tylko w pamięci: w obrębie wizyty
 * stan per-ekran żyje (ADR-0013), świeża wizyta nadal zaczyna czysto.
 */
function useCalendarSearch(): string {
  const { pathname, search } = useLocation()
  const lastSearch = useRef('')
  useEffect(() => {
    if (pathname === '/event-calendar' && search) {
      lastSearch.current = search
    }
  }, [pathname, search])
  return lastSearch.current
}

export function AppShell({ children }: { children: ReactNode }) {
  const calendarSearch = useCalendarSearch()
  const navTo = (path: string) =>
    path === '/event-calendar' && calendarSearch
      ? { pathname: path, search: calendarSearch }
      : path

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/event-calendar" className="text-lg font-semibold tracking-tight">
            gametime
          </Link>
          <nav aria-label="Main navigation" className="hidden md:flex md:items-center md:gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={navTo(item.path)}
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
          {/* Slot na przyszłość: strefa czasowa / menu użytkownika */}
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
          <span>Data sources (soon)</span>
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
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background md:hidden"
      >
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={navTo(item.path)}
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
