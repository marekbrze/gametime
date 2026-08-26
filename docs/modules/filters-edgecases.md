# filters — Edge Cases

Wynik `proto-edgecases`, 2026-08-26. Audyt kodu z `proto-lofi` (commit `0015557`) przeciw spec `docs/modules/filters.md` + ADR-0012..0014.

## Coverage

- **Spec już captured** (`docs/modules/filters.md`, sekcja Edge Cases — 8 pozycji): zero-match + Clear filters, off-season suffixy lig, martwy AND sport×liga, pasek zredukowany na SeasonSchedule, nieprawidłowe wartości URL, konflikt w URL, starzenie linków `w`, filtry vs scenariusze dev.
- **Already handled in code**: wszystkie 8 — zero-match: `EmptyWeek.tsx:36` (hasFilters branch); suffixy: `LeagueFilterPanel.tsx:45`; uzgadnianie: `filter-events.ts` (`reconcileSport`/`selectSport`); parsowanie URL z cichym dropem: `use-url-filters.ts:24`; konflikt liga-wygrywa: `use-url-filters.ts:35`. Do tego dwa utrwalone w lofi (nie ze speca): chaining szybkich zmian po refie (`use-url-filters.ts:90`) i guard na przerwaną navigację przy Back (`use-url-filters.ts:74`). Zweryfikowane E2E w chromium (desktop + mobile).
- **New gaps found**: 13
- **By severity**: 🔴 1 · 🟡 5 · 🟢 7
- **Po proto-harden (ADR-0016)**: 10 zamkniętych ✅ · 3 odroczone ❌ (5 → moduł data-source; 7 → zakres event-calendar/mocki; 10 → zaakceptowane na lo-fi)

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | ✅ | Navigation | Zmiana taby gubi filtry w trakcie sesji | ~~reset~~ → `useCalendarSearch` + `navTo`: NavLink Calendar wraca z ostatnim query (tylko w pamięci — świeża wizyta nadal czysta, ADR-0013) | AppShell trzyma ostatni query `/event-calendar` | `src/shared/components/AppShell.tsx:18,31` |
| 2 | ✅ | Cross-module | Blok Now ignoruje filtry | ~~surowe events~~ → **decyzja designera: filtry obowiązują Now** — wspólny predykat `passesScreenFilters` karmi listę i Now; pusty zbiór = blok znika | filtry obowiązują też Now | `EventCalendarScreen.tsx:76,91` |
| 3 | ✅ | Data states | `?w=` bez ograniczeń | ~~parse bez granic~~ → clamp do ±52 tygodni (`MAX_WEEK_OFFSET`) | clamp przy parsowaniu | `use-url-filters.ts:40,45` |
| 4 | ✅ | Data states | Empty state kłamie przy deep-linku w=duże+filtry | ~~hasFilters wygrywa~~ → beyondWindow ma pierwszeństwo przed hasFilters ("No data for this week" + nota o oknie) | beyondWindow pierwszeństwo | `EmptyWeek.tsx:40`, story `States/EmptyBeyondWindowWithFilters` |
| 5 | ❌ | Cross-module | Dryf katalogu: panel czyta statyczne LEAGUES/SPORTS | bez zmian (dziś ID zbieżne) | runtime merge sports+leagues ze snapshota | **odroczone do modułu data-source** — rozszerzenie `registerCatalogTeams`; zrobić zanim pipeline dostanie pierwszą nową ligę |
| 6 | ✅ | Navigation | Back spam: każdy checkbox = wpis historii | ~~każdy tick push~~ → **decyzja designera: coalescing** — pierwsza zmiana push, kolejne w <500ms replace; Back chodzi po stanach, nie po tickach (ADR-0016 precyzuje ADR-0014) | coalescing rapid changes | `use-url-filters.ts:104` |
| 7 | ❌ | 🟢→odrzucone | Mock/dev bez DataWindow | bez zmian | generator mocków dopisuje window | **odroczone do zakresu event-calendar/mocków** (ADR-0011), nie modułu filters |
| 8 | ✅ | Forms & input | Konflikt w URL niekanoniczny po wejściu | ~~URL trzyma surowy konflikt~~ → kanonizacja replace na mountu (raz, bez wpisu historii) | replace-canonicalize przy mountu | `use-url-filters.ts:87` |
| 9 | ✅ | Forms & input | Powtórzony parametr `league` | ~~tylko pierwszy~~ → `.getAll()` + flatMap split(','), dedupe | `.getAll()` + merge | `use-url-filters.ts:31` |
| 10 | ❌ | Navigation | Resize przez granicę md przy otwartym panelu | bez zmian — popover/drawer swap działa, `open` przechodzi | zaakceptować | **zaakceptowane** — egzotyczny przypadek; focus per-powierzchnia należy do base-ui, wróci w audycie jeśli się ujawi |
| 11 | ✅ | Loading & async | Popover bez max-height | ~~bez ograniczenia~~ → `max-h-96 overflow-y-auto` | max-h + scroll | `MoreFilters.tsx:54` |
| 12 | ✅ | A11y | Cisza dla SR przy zawężaniu listy | ~~cisza~~ → sr-only `aria-live=polite` "N events shown this week" | aria-live z liczbą | `EventCalendarScreen.tsx:191` |
| 13 | ✅ | A11y / UX | Sport przeskakuje na "All" bez sygnału | ~~cicho~~ → statyczna podpowiedź w panelu gdy sport wybrany (przed zaskoczeniem, nie po) | adnotacja w panelu | `LeagueFilterPanel.tsx:27`, story `LeaguePanelSportSelected` |

Kategorie bez gapów: **Errors** (parsowanie URL nie ma ścieżki błędu, akcje filtrów nie są async), **State transitions** (uzgadnianie sport×liga domyka martwe AND-y), **Prototype-specific/LocalStorage** (moduł celowo nie pisze do storage — ADR-0013; brak powierzchni awarii zapisu), **Action outcomes** (natychmiastowe stosowanie = feedback sam w sobie; Clear filters istnieje i jest odwracalny przez Back).

## Priority list

1. **#1 Filtry giną przy zmianie taby** — jedyne 🔴; łamie obietnicę "per-ekran w pamięci" w obrębie wizyty i psuje core loop (sprawdź watchlistę → wróć do kalendarza). Naprawa tania (NavLink z zapamiętanym query).
2. **#2 Now block × filtry** — najbardziej zauważalna niespójność postrzegana ("filtrowałem piłkę, a NBA live mi wisi na szczycie"); jedno pytanie do designera.
3. **#3+#4 Prawdomówność deep-linków** — clamp `w` + pierwszeństwo beyondWindow w empty state; razem zamykają klasę mylących stanów z udostępnionych linków.
4. **#6 Back spam** — coalescing rapid changes; chroni ergonomię Backa zanim liczba lig/dimensionów podrośnie.
5. **#5 Dryf katalogu** — zarządcze; zrobić w data-source zanim pipeline dostanie pierwszą nową ligę.

## Hand-off to proto-harden

Najpierw z designera jedna decyzja: **#2 (Now block a filtry)** — sugerowany default: filtry obowiązują też Now. Potem implementacja: #1 (persist query przy tab-switch), #3+#4 (clamp + pierwszeństwo beyondWindow), #13 (hint przy rekoncyliacji). #5 kieruje do zmiany w data-source; #6–#12 wg uznania (🟢).
