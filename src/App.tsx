import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './shared/components/AppShell'
import { RoutePlaceholder } from './shared/components/RoutePlaceholder'
import { DevToolbar } from './shared/components/DevToolbar'
import { EventCalendarScreen } from './modules/event-calendar/components/EventCalendarScreen'
import { WatchlistScreen } from './modules/watchlist/components/WatchlistScreen'

function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route index element={<Navigate to="/event-calendar" replace />} />
          <Route path="/event-calendar" element={<EventCalendarScreen />} />
          <Route path="/watchlist" element={<WatchlistScreen />} />
          <Route path="/teams" element={<RoutePlaceholder label="Teams" />} />
          <Route path="/settings" element={<RoutePlaceholder label="Settings" />} />
          <Route path="*" element={<Navigate to="/event-calendar" replace />} />
        </Routes>
      </AppShell>
      <DevToolbar />
    </HashRouter>
  )
}

export default App
