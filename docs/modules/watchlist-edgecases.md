# Watchlist — Edge Cases

Wynik `proto-edgecases` (baseline po `proto-lofi`, commit `de8313d`); statusy po `proto-harden`
(ADR-0018). Audyt całego modułu.
Uwaga wyjściowa: moduł nie ma własnego specu z `proto-detail` — za baseline wymagań przyjęto
sekcję **watchlist** z `MODULES.md`, akcje Watchlist z `ACTIONS.md` i encję `WATCHLIST_ENTRY`
z `ENTITY_MAP.md` (tak samo jak przy budowie lofi).

## Coverage
- **Baseline już captures**: upcoming + automatycznie zwinięta sekcja past (MODULES.md);
  remove entry jako jedyny sposób sprzątania, jump to event, bulk ICS "wszystkie nadchodzące"
  (ACTIONS.md); upcoming → past automatycznie po zakończeniu, nigdy nie wygasa sama (ENTITY_MAP).
- **Already handled in code** (lofi + dziedziczone z hardened modułów):
  - pusta watchlista → wyjaśnienie + CTA "Browse this week" (`WatchlistScreen.tsx`, `EmptyWatchlist.tsx`)
  - zero-match po filtrach → empty state z "Clear filters"
  - błąd ładowania danych → LoadError + retry; skeleton pierwszego ładowania
  - awaria zapisu storage → StorageWarning banner, rollback wizualny gwiazdki (`use-local-storage.ts`)
  - kanonizacja/deep-link filtrów z URL (`use-url-filters.ts`)
  - dialog: Escape/tło/× + zwrot fokusu (zweryfikowane E2E)
  - aria-live licznik upcoming
- **Gaps found**: 14 → **closed 13, deferred 1** (po harden)
- **By severity**: 🔴 1 (✅) · 🟡 8 (✅) · 🟢 5 (4× ✅, 1× ❌)

## Inventory

| # | Severity | Category | Edge case | Behavior today (przed harden) | Suggested behavior | Where | Po harden |
|---|----------|----------|-----------|----------------|--------------------|-------|-----------|
| 1 | 🔴 | Prototype-specific | Parsowalny, ale niewłaściwy kształt w localStorage (np. `gametime.settings = {}` — odtworzone w E2E; analogicznie `gametime.watchlist` bez tablicy) | biały ekran — `bands[kind].start` / `entries.map` na undefined | walidacja kształtu przy odczycie + scalenie z defaultami | `use-local-storage.ts`, `use-settings.ts`, `time-bands.ts` | ✅ `settings/lib/sanitize.ts` + `use-settings.ts:10`; `use-watchlist.ts:12`; `use-favorite-teams.ts:10`; bonus: łańcuchowanie funkcyjnych updaterów w `use-local-storage.ts:31` |
| 2 | 🟡 | Cross-module / lifecycle | Odgwiazdkowane wydarzenie **przełożone**: feed rodzi nową instancję Event z nowym terminem (ENTITY_MAP), wpis dalej wskazuje starą | stara instancja przygaszona, po terminie dryfuje do past; nowa bez gwiazdki | hint "Rescheduled" + gwiazdka na nowej instancji | `watchlist-groups.ts:32` | ✅ decyzja designera: dialog pokazuje "Rescheduled → nowy termin" + "Watch new date" migrujący gwiazdkę — `lib/reschedule.ts`, `EventDetailsDialog.tsx` |
| 3 | 🟡 | Cross-module / lifecycle | Odgwiazdkowane wydarzenie **anulowane** | znika bez śladu — na liście usera pozycja evaporuje po cichu | pokazać anulowane przygaszone z "Canceled" | `WatchlistScreen.tsx:54` | ✅ decyzja designera: canceled zostaje przygaszony z plakietką, poza eksportem — `WatchlistScreen.tsx` (join bez filtra), `EventRow.tsx` (dimmed), eksport `!statusOverride` |
| 4 | 🟡 | Cross-module / lifecycle | Wpisy poza oknem danych — przypadek częściowy | sieroty całkowicie niewidoczne | stopka z licznikiem + opcja sprzątania | `WatchlistScreen.tsx:52` | ✅ nota "N starred events outside the loaded date range" + Clear z undo — `WatchlistScreen.tsx` (`orphanedEntries`, `handleClearOrphans`) |
| 5 | 🟡 | Navigation & flow | "No watched events in the loaded date range" — przypadek całkowity | blok bez akcji — dead end | CTA + sprzątanie sierot | `WatchlistScreen.tsx:181` | ✅ "Browse this week" + "Clear N stale entries" — `WatchlistScreen.tsx` |
| 6 | 🟡 | Action outcomes | Remove entry bez confirm/undo | natychmiastowe usunięcie, na pastach nieodwracalne poza oknem | undo toast | `use-watchlist.ts:11` | ✅ decyzja designera: undo toast 5s ("Removed from watchlist [Undo]") — `WatchlistToast.tsx`, `handleToggleWatch`; wpis wraca verbatim (addedAt) |
| 7 | 🟡 | State transitions | Przejście upcoming → past NA ŻWO (tick 30s) | wiersz znika w zwiniętym Past bez wyjaśnienia | liczniki + nota | `watchlist-groups.ts:32` | ✅ zaakceptowany default (bez dodatkowego UI): liczniki Past i aria-live aktualizują się w tym samym ticku; do odwiedzenia po testach z userami |
| 8 | 🟡 | Data states | Wydarzenie LIVE nieodróżnialne od scheduled | brak markera | chip Live / sekcja Now | `EventRow.tsx` | ✅ decyzja designera: chip LIVE w wierszu (tylko watchlista; kalendarz ma NowBlock) — `EventRow.tsx`/`EventCard.tsx` `liveIndicator` |
| 9 | 🟡 | Action outcomes | Eksport zbiorczy pakuje też przełożone | ICS z wydarzeń, które się nie odbędą | wykluczyć postponed | `WatchlistScreen.tsx:87` | ✅ eksport filtruje `!statusOverride` (postponed + canceled) — `WatchlistScreen.tsx` `exportEvents` |
| 10 | 🟢 | Loading & async | Skeleton kształtu tygodnia na ekranie bez pagera | WeekSkeleton z pagerem | skeleton pod layout watchlisty | `WatchlistScreen.tsx:120` | ✅ `WatchlistSkeleton.tsx` |
| 11 | 🟢 | Navigation & flow | Parametr `?w=` bez znaczenia na /watchlist | utrzymywany w URL, nic nie robi | stripować `w` | `use-url-filters.ts:40` | ✅ `useUrlFilters({ week: false })` — `w` nieemitowany/stripowany; kalendarz bez zmian (default `week: true`) |
| 12 | 🟢 | Navigation & flow | Dialog "Show in calendar" bez clamp offsetu | `?w=999` z dev-override | clamp ±52 | `EventDetailsDialog.tsx:85` | ✅ clamp po wyeksportowanym `MAX_WEEK_OFFSET` — `EventDetailsDialog.tsx`, `filters/index.ts` |
| 13 | 🟢 | Prototype-specific | Offline w prod | LoadError mimo lokalnych wpisów | zaakceptować / przyszły SW-cache | `use-events.ts:79` | ❌ świadomie odroczone — cała app zależna od snapshota; cache to decyzja platformowa, nie modułowa |
| 14 | 🟢 | Action outcomes | Eksport bez feedbacku | pobranie w ciszy | toast | `WatchlistScreen.tsx:130` | ✅ toast "Downloaded N events" — `handleExport`, `WatchlistToast.tsx` |

Kategorie sprawdzone bez gapów: **Forms & input** (moduł nie ma formularzy — jedyne wejścia to
filtry i gwiazdka, oba obsłużone), **Errors/validation** (brak pól user-input), **Boundary values**
(offsety/daty clampowane), **very long values** (etykiety truncatowane w wierszach, dialog zawija tytuł).

## Priority list
1. ~~#1 walidacja kształtu storage~~ ✅
2. ~~#3 + #2 canceled/postponed na watchliście~~ ✅
3. ~~#4 + #5 sieroty poza oknem~~ ✅
4. ~~#8 live + #7 żywe przejście do past~~ ✅ (default)
5. ~~#6 undo, #9 postponed w eksporcie~~ ✅
6. ~~pozostałe 🟢 (#10–#12, #14)~~ ✅; #13 ❌ (odroczone)

## Hand-off to proto-harden
Zrealizowane w całości (patrz kolumna „Po harden"). Jedyne odkładane: #13 offline (platformowe).
Weryfikacja: E2E harden 25/25 + regresja happy-path 8/8 (chromium), stories
`Watchlist/WatchlistScreen` (WithData/Empty/OnlyPast/FilteredToEmpty/WithCanceledAndLive/WithOrphans/OnlyOrphaned)
i `Watchlist/States` (Loading/UndoToast/InfoToast).
