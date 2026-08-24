import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './shared/components/AppShell'
import { RoutePlaceholder } from './shared/components/RoutePlaceholder'
import { DevToolbar } from './shared/components/DevToolbar'

function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route index element={<Navigate to="/event-calendar" replace />} />
          <Route path="/event-calendar" element={<RoutePlaceholder label="Kalendarz" />} />
          <Route path="/watchlist" element={<RoutePlaceholder label="Obserwowane" />} />
          <Route path="/teams" element={<RoutePlaceholder label="Drużyny" />} />
          <Route path="/settings" element={<RoutePlaceholder label="Ustawienia" />} />
          <Route path="*" element={<Navigate to="/event-calendar" replace />} />
        </Routes>
      </AppShell>
      <DevToolbar />
    </HashRouter>
  )
}

export default App
