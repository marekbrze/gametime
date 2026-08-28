import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './shared/components/AppShell'
import { DevToolbar } from './shared/components/DevToolbar'
import { EventCalendarScreen } from './modules/event-calendar/components/EventCalendarScreen'
import { WatchlistScreen } from './modules/watchlist/components/WatchlistScreen'
import { TeamsScreen } from './modules/teams/components/TeamsScreen'
import { LeagueScreen } from './modules/teams/components/LeagueScreen'
import { TeamScheduleScreen } from './modules/teams/components/TeamScheduleScreen'
import { SettingsScreen } from './modules/settings/components/SettingsScreen'

function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route index element={<Navigate to="/event-calendar" replace />} />
          <Route path="/event-calendar" element={<EventCalendarScreen />} />
          <Route path="/watchlist" element={<WatchlistScreen />} />
          {/* Dwupoziomowa nawigacja teams (ADR-0020) — jawne prefiksy
              league/team, bo przestrzenie id kolidują wzorcem */}
          <Route path="/teams" element={<TeamsScreen />} />
          <Route path="/teams/league/:leagueId" element={<LeagueScreen />} />
          <Route path="/teams/team/:teamId" element={<TeamScheduleScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/event-calendar" replace />} />
        </Routes>
      </AppShell>
      <DevToolbar />
    </HashRouter>
  )
}

export default App
