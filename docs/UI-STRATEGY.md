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

**UI language: English** (decyzja odwrócona względem wstępnych polskich etykiet — patrz ADR-0003). Etykiety = Code Names z GLOSSARY.md.

| Module (code) | Label (display) | Order |
|---|---|---|
| `event-calendar` | Calendar | 1 |
| `watchlist` | Watchlist | 2 |
| `teams` | Teams | 3 |
| `settings` | Settings | 4 |

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
- Ścieżki modułów: `/event-calendar`, `/watchlist`, `/teams`, `/settings` + dwupoziomowa nawigacja teams (ADR-0020): `/teams/league/:leagueId` (lista drużyn ligi) i `/teams/team/:teamId` (terminarz sezonu) — jawne prefiksy, bo przestrzenie id lig i drużyn kolidują wzorcem
- Placeholder `RoutePlaceholder` na każdą ścieżkę — `proto-lofi` podmienia na rzeczywiste ekrany
- Scroll: **zmiana pathname = powrót na górę okna** (efekt w `AppShell`, ADR-0001) — nowy ekran nie dziedziczy scrolla poprzedniego. Zmiana `search` (stan widoku, ADR-0014) scrolla nie rusza.

## Implementacja
- `src/shared/components/AppShell.tsx` — header + main (contained) + footer + mobilne bottom tabs (Tailwind: `md:` breakpoint przełącza warianty)
- `src/shared/components/RoutePlaceholder.tsx` — puste ekrany modułów
- `src/App.tsx` — routing; `index` i `*` → redirect na `/event-calendar`
- Ikony: `lucide-react` (CalendarDays, Star, Trophy, Settings); styling: neutralne defaulty shadcn, zero custom kolorów
