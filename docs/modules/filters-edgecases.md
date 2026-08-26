# filters — Edge Cases

Wynik `proto-edgecases`, 2026-08-26. Audyt kodu z `proto-lofi` (commit `0015557`) przeciw spec `docs/modules/filters.md` + ADR-0012..0014.

## Coverage

- **Spec już captured** (`docs/modules/filters.md`, sekcja Edge Cases — 8 pozycji): zero-match + Clear filters, off-season suffixy lig, martwy AND sport×liga, pasek zredukowany na SeasonSchedule, nieprawidłowe wartości URL, konflikt w URL, starzenie linków `w`, filtry vs scenariusze dev.
- **Already handled in code**: wszystkie 8 — zero-match: `EmptyWeek.tsx:36` (hasFilters branch); suffixy: `LeagueFilterPanel.tsx:45`; uzgadnianie: `filter-events.ts` (`reconcileSport`/`selectSport`); parsowanie URL z cichym dropem: `use-url-filters.ts:24`; konflikt liga-wygrywa: `use-url-filters.ts:35`. Do tego dwa utrwalone w lofi (nie ze speca): chaining szybkich zmian po refie (`use-url-filters.ts:90`) i guard na przerwaną navigację przy Back (`use-url-filters.ts:74`). Zweryfikowane E2E w chromium (desktop + mobile).
- **New gaps found**: 13
- **By severity**: 🔴 1 · 🟡 5 · 🟢 7

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🔴 | Navigation | Zmiana taby gubi filtry w trakcie sesji | Calendar → Watchlist → Calendar: NavLink idzie na goły `/event-calendar`, query znika z URL → filtry reset mimo że ADR-0013 obiecuje "stan per-ekran w pamięci" w obrębie wizyty | AppShell trzyma ostatni query `/event-calendar` (NavLink z odtwarzanym search) albo per-route query w sessionStorage | `src/shared/components/AppShell.tsx:7`, `use-url-filters.ts:57` |
| 2 | 🟡 | Cross-module | Blok Now ignoruje filtry | filtr ⚽ + liga=Premier League → NowBlock nadal pokazuje live NBA (dostaje surowe `events`) | decyzja designera; suggested: filtry obowiązują też Now (to część ekranu listy — "każda lista się filtruje") | `EventCalendarScreen.tsx:136` |
| 3 | 🟡 | Data states | `?w=` bez ograniczeń | `?w=99999` przechodzi parse; ratuje dopiero EmptyWeek beyondWindow (i tylko dla źródła json) | clamp `w` do okna danych (albo sensownych granic) przy parsowaniu | `use-url-filters.ts:38` |
| 4 | 🟡 | Data states | Empty state kłamie przy deep-linku w=duże+filtry | `?w=50&league=nhl`: branch `hasFilters` wygrywa → "No events match your filters", choć tydzień i tak nie ma danych | beyondWindow ma pierwszeństwo przed hasFilters (albo copy łączący oba powody) | `EmptyWeek.tsx:36` |
| 5 | 🟡 | Cross-module | Dryf katalogu: panel czyta statyczne LEAGUES/SPORTS | snapshot ma własny katalog; synchronizowane są tylko teams (`registerCatalogTeams`). Dziś ID zbieżne z konwencji; nowa liga z pipeline'u (NASCAR/WRC…) będzie niewidoczna w panelu i ukryta przez filtry ligowe, suffix "no events" może kłamać | runtime merge sports+leagues ze snapshota (rozszerzenie wzorca `registerCatalogTeams`) — zakres data-source, zanim padnie pierwsza nowa liga | `src/modules/data-source/data/catalog.ts:85`, `LeagueFilterPanel.tsx:1` |
| 6 | 🟡 | Navigation | Back spam: każdy checkbox = wpis historii | 6 togglów lig = 6 razy Back, żeby wyjść; zaakceptowane w ADR-0014 ("każda zmiana pushuje"), ale koszt Backa rośnie z liczbą wymiarów | coalescing: pierwsza zmiana push, kolejne w <500ms replace | `use-url-filters.ts:99` |
| 7 | 🟢 | Data states | Mock/dev bez DataWindow | scenariusz devEvents nie ma okna → beyondWindow off → `?w=30` pokazuje mylące "It may be off-season" | generator mocków dopisuje window (zakres event-calendar, ADR-0011) | `EventCalendarScreen.tsx:54` |
| 8 | 🟢 | Forms & input | Konflikt w URL niekanoniczny po wejściu | `?sport=hockey&league=premier-league`: select pokazuje uzgodnione "All sports", URL trzyma surowy konflikt do następnej zmiany | replace-canonicalize przy mountu gdy parse(raw) ≠ raw | `use-url-filters.ts:35` |
| 9 | 🟢 | Forms & input | Powtórzony parametr `league` | `?league=nhl&league=nba` — `get()` czyta tylko pierwszy, drugi cicho znika | `.getAll()` + join, albo zaakceptować i udokumentować | `use-url-filters.ts:31` |
| 10 | 🟢 | Navigation | Resize przez granicę md przy otwartym panelu | popover się odmontowuje, drawer montuje się z przeniesionym `open` — działa, ale focus/kontekst ginie w trakcie interakcji | zaakceptować na lo-fi; sprawdzić focus w harden | `MoreFilters.tsx:40,50,69` |
| 11 | 🟢 | Loading & async | Popover bez max-height | drawer ma `max-h-[60dvh]` + scroll; popover `w-80` bez ograniczenia — przy przyszłym wzroście katalogu wyjdzie poza viewport | `max-h-[…] overflow-y-auto` na PopoverContent | `MoreFilters.tsx:54` |
| 12 | 🟢 | A11y | Cisza dla SR przy zawężaniu listy | filtr zastosowany = lista się zmienia, ale bez aria-live; SR user nie wie, że coś zniknęło | aria-live polite z liczbą widocznych wydarzeń nad listą | `EventCalendarScreen.tsx` (region listy) |
| 13 | 🟢 | A11y / UX | Sport przeskakuje na "All" bez sygnału | zaznaczenie obcej ligi w panelu cicho resetuje select sportu (uzgadnianie OK, zmiana niewidoczna) | subtelna adnotacja w panelu przy zmianie albo transient hint | `LeagueFilterPanel.tsx:41` + `FilterBar.tsx:62` |

Kategorie bez gapów: **Errors** (parsowanie URL nie ma ścieżki błędu, akcje filtrów nie są async), **State transitions** (uzgadnianie sport×liga domyka martwe AND-y), **Prototype-specific/LocalStorage** (moduł celowo nie pisze do storage — ADR-0013; brak powierzchni awarii zapisu), **Action outcomes** (natychmiastowe stosowanie = feedback sam w sobie; Clear filters istnieje i jest odwracalny przez Back).

## Priority list

1. **#1 Filtry giną przy zmianie taby** — jedyne 🔴; łamie obietnicę "per-ekran w pamięci" w obrębie wizyty i psuje core loop (sprawdź watchlistę → wróć do kalendarza). Naprawa tania (NavLink z zapamiętanym query).
2. **#2 Now block × filtry** — najbardziej zauważalna niespójność postrzegana ("filtrowałem piłkę, a NBA live mi wisi na szczycie"); jedno pytanie do designera.
3. **#3+#4 Prawdomówność deep-linków** — clamp `w` + pierwszeństwo beyondWindow w empty state; razem zamykają klasę mylących stanów z udostępnionych linków.
4. **#6 Back spam** — coalescing rapid changes; chroni ergonomię Backa zanim liczba lig/dimensionów podrośnie.
5. **#5 Dryf katalogu** — zarządcze; zrobić w data-source zanim pipeline dostanie pierwszą nową ligę.

## Hand-off to proto-harden

Najpierw z designera jedna decyzja: **#2 (Now block a filtry)** — sugerowany default: filtry obowiązują też Now. Potem implementacja: #1 (persist query przy tab-switch), #3+#4 (clamp + pierwszeństwo beyondWindow), #13 (hint przy rekoncyliacji). #5 kieruje do zmiany w data-source; #6–#12 wg uznania (🟢).
