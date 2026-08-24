# UI Strategy

Wynik `proto-highlevelui`. Decyzje strukturalne app shellu — bez decyzji wizualnych (te należą do `proto-brand` / `proto-design`).

## Platform
**Responsive** — dwa warianty nawigacji: desktop i mobile.

## Navigation
- Type (desktop): **top bar** — poziome menu w headerze (4 destinationy mieszczą się swobodnie, pełna szerokość treści)
- Type (mobile): **bottom tabs** — 4 stałe pozycje, fixed na dole ekranu

## Home page
**Redirect do pierwszego modułu** — `/` przekierowuje na `/event-calendar` (lista tygodnia). Zgodne z happy path z PROJECT.md ("od razu po wejściu aktualny tydzień, zero setupu"). Brak osobnej strony głównej.

## Module navigation

| Module (code) | Label (display) | Order |
|---|---|---|
| `event-calendar` | Kalendarz | 1 |
| `watchlist` | Obserwowane | 2 |
| `teams` | Drużyny | 3 |
| `settings` | Ustawienia | 4 |

Moduły `filters`, `calendar-export`, `data-source`, `data-pipeline` **nie są destinationami nawigacji** — żyją wewnątrz ekranów (pasek filtrów, akcje wierszy, warstwa danych).

## Content layout
- Container: **responsive contained** — `max-w-6xl` (~1150px), wycentrowane na desktopie; pełna szerokość na mobile
- Breadcrumbs: **nie** — nawigacja płaska, głębia co najwyżej lista → terminarz drużyny (powrót top barem/tabsami)

## Shared elements
- Header: **tak** — "gametime" po lewej (link do kalendarza), desktopowa nawigacja w środku, slot placeholder po prawej (przyszłe: strefa czasowa, menu)
- Footer: **tak** — "gametime · Źródła danych · GitHub" (linki placeholder na razie)
- Notifications: **nie** — brak powiadomień w v1 (świadomie poza zakresem)

## Routing
- `HashRouter` (nie `BrowserRouter`) — cel deploy to statyczne GitHub Pages, gdzie deep-link pathowy daje 404 po odświeżeniu; hash routing jest odporny na to bez trików z `404.html`. Koszt: `#/` w URL.
- Ścieżki modułów: `/event-calendar`, `/watchlist`, `/teams`, `/settings` + `/teams/:teamId` (przyszły terminarz sezonu — doda `proto-lofi` modułu teams)
- Placeholder `RoutePlaceholder` na każdą ścieżkę — `proto-lofi` podmienia na rzeczywiste ekrany

## Implementacja
- `src/shared/components/AppShell.tsx` — header + main (contained) + footer + mobilne bottom tabs (Tailwind: `md:` breakpoint przełącza warianty)
- `src/shared/components/RoutePlaceholder.tsx` — puste ekrany modułów
- `src/App.tsx` — routing; `index` i `*` → redirect na `/event-calendar`
- Ikony: `lucide-react` (CalendarDays, Star, Trophy, Settings); styling: neutralne defaulty shadcn, zero custom kolorów
