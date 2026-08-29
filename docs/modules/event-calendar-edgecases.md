# event-calendar (+ warstwa data-source) — Edge Cases

Wynik `proto-edgecases`, po przełączeniu na realne dane (`DataSnapshot` z data-pipeline).
Zakres: cały moduł event-calendar + stany runtime warstwy data-source, z focusem
na nowe sytuacje wprowadzone przez realne dane (fetch, okno danych, off-seasony,
wolumetria). Diagnoza — decyzje i implementacja należą do `proto-harden`.

## Coverage
- **Spec już captured** (`docs/modules/event-calendar.md`): brak realtime (statusy z czasu), pusty tydzień (empty state), zmiana strefy/pasm (recomputacja), event przekraczający granicę pasa (klasyfikacja po starcie), dziś po północy (ViewingDay).
- **Already handled in code**: pusty tydzień → `EmptyWeek` (`EventCalendarScreen.tsx:159`); statusy pochodne → `deriveStatus` (`status.ts:11`); ViewingDay/noc → `viewingDayKeyInZone` (`EventCalendarScreen.tsx:51,79`); truncate długich tytułów → `EventRow.tsx:48`; tabular-nums → `EventRow.tsx:45`, `NowBlock.tsx:60`.
- **Zweryfikowane OK pod realną wolumetrią** (~156 eventów / 3 tyg, ~100 na tydzień): render listy bez virtualizacji działa płynnie; zwinięte sekcje nocy trzymają porządek. Uwaga na październik: NHL+NBA wracają → noce po 5–10 eventów (mechanika zwinięcia już to obsługuje, zweryfikować wzrokowo w sezonie).
- **New gaps found**: 15
- **By severity**: 🔴 3 · 🟡 7 · 🟢 5
- **Po proto-harden (ADR-0011)**: 11 zamkniętych ✅ · 4 odroczone ❌ (8, 9 → moduły watchlist/teams; 13, 14 → moduł filters)

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | ✅ | Loading & async | Initial load bez skeletona | ~~blank~~ → `WeekSkeleton` — ghost pagera + 3 grupy dni, `aria-busy` | skeleton odzwierciedlający strukturę | `src/modules/event-calendar/components/WeekSkeleton.tsx`, story `States/Loading` |
| 2 | ✅ | Errors | Fetch snapshotu pada → ślepa uliczka | ~~bez retry~~ → `LoadError` (karta z Try again, focus na karcie) + `refresh()` w `useEvents` | error card z retry bez reloadu | `src/modules/event-calendar/components/LoadError.tsx`, `use-events.ts` (refresh), story `States/FetchError` |
| 3 | ✅ | Prototype-specific | Zapis localStorage pada po cichu | ~~silent~~ → zapis przed setState (wizualny rollback) + `writeError` z hooków → banner `StorageWarning` zamykalny | toast/banner + rollback | `src/shared/hooks/use-local-storage.ts` (write-first), `components/StorageWarning.tsx`, story `States/StorageFailure` |
| 4 | ✅ | Data states | Tydzień poza oknem danych (−7d/+14d) | ~~mylący „off-season"~~ → wariant "No data for this week" + nota o zakresie danych + Back to this week | empty state świadomy okna | `components/EmptyWeek.tsx` (beyondWindow), `EventCalendarScreen.tsx` (beyondWindow), story `States/EmptyBeyondWindow` |
| 5 | ✅ | Data states | Sport off-season w filtrach | ~~brak sygnału~~ → sporty bez wydarzeń w oknie dostają suffix " — no events" (opcja nieblokująca) | adnotacja w opcji | `MiniFilterBar.tsx` (sportsWithEvents), `EventCalendarScreen.tsx` (sportsWithEvents) |
| 6 | ✅ | State transitions | Przełożony mecz znika całkowicie | ~~znika~~ → **decyzja designera: pokazać przygaszone** — postponed zostaje na liście (dimmed + adnotacja); canceled nadal ukryty (domykanie — ENTITY_MAP) | dimming + adnotacja w starym terminie | `EventCalendarScreen.tsx` (filtr tylko canceled), `EventRow.tsx` (dimmed), ADR-0011 |
| 7 | ✅ | Loading & async | „LIVE" po zakończonym meczu (stała 3h) | ~~stała 3h~~ → `estimatedDurationMs()`: soccer 2.5h, hockey 2.75h, basketball 2.5h, NFL 3.5h, F1 per sessionType (race 2h, pozostałe 1.5h); ten sam szacunek w eksporcie kalendarzy | per-sport szacunki | `src/modules/data-source/lib/status.ts`, `calendar-export/lib/export.ts` |
| 8 | ❌ | Cross-module | Osierocone wpisy watchlisty po przełożeniu | bez zmian | snapshot danych w entry + rekoncyliacja | **odroczone do proto-detail modułu watchlist** — kształt entry musi zapaść przy budowie listy |
| 9 | ❌ | Cross-module | Ulubione drużyny z ery mocków | bez zmian | migracja/oczyszczenie martwych ID | **odroczone do modułu teams** — zaraz potem wejdzie migracja z UI ulubionych |
| 10 | ✅ | Prototype-specific | Brak scenariusza „mock" dla dev bez sieci | ~~brak drogi~~ → scenariusz `mock` w DevToolbar pisze `gametime.devEvents` z generatora | scenariusz mock | `src/scenarios/mock.ts`, `src/scenarios/index.ts` |
| 11 | ✅ | Loading & async | Świeżość danych niewidoczna | ~~niewidoczna~~ → stopka "Data as of {data, godzina}" pod listą (tylko źródło json) | subtelna stopka | `EventCalendarScreen.tsx` (dataAsOf) |
| 12 | ✅ | Errors | Offline przy pierwszej wizycie | copy LoadError mówi wprost o połączeniu; retry działa po powrocie sieci | copy + retry | `LoadError.tsx` — cache-first fetch świadomie poza harden |
| 13 | ❌ | Navigation | Back button przy stronicowaniu tygodni | bez zmian | pushState per tydzień | **odroczone** — ADR-0006 nie obiecuje shareability; wróci z modułem filters (stan w URL) |
| 14 | ❌ | Navigation | Deep-link do konkretnego tygodnia | bez zmian | `?w={offset}` w hash | **odroczone** — jw. |
| 15 | ✅ | Action outcomes | ExportMenu bez Escape-close | ~~bez Escape~~ → listener na dokumencie, focus wraca na trigger | Escape + focus return | `ExportMenu.tsx` (useEffect keydown) |

**Kategorie sprawdzone bez gapów**: Forms & input (moduł nie ma formularzy — settings to osobny moduł); unicode/długie wartości (truncate + title-only F1 — OK); walidacja wejścia (brak wejść użytkownika poza modułami localStorage); dead-endy nawigacji (This week zawsze dostępny).

## Priority list
1. **#1 + #2 — skeleton + error z retry na głównym ekranie**: to jest pierwszy kontakt z produktem; blank i ślepa uliczka przy padniętym fetchu podważają obietnicę "od wejścia działa". Wymaga drobnego rozszerzenia `useEvents` o `refresh()`.
2. **#3 — cichy błąd zapisu localStorage**: jedyna droga utraty danych użytkownika w aplikacji; rollback + toast to mały koszt.
3. **#4 + #5 — empty states świadome okna danych i off-seasonu**: rdzeń produktu to odpowiedź "co w tym tygodniu" — komunikat nie może kłamać (dziś wmawia off-season na tygodniu, dla którego po prostu nie mamy danych).
4. **#7 — per-sport czas trwania**: z realnych danych false-LIVE to codzienny artefakt widoczny w bloku Now.
5. **#6 — widoczność przełożonych**: decyzja projektowa do podjęcia z designerem (ukrywanie vs dimming w starym terminie) — przed budową modułu watchlist, bo #8 z niej wynika.

## Hand-off to proto-harden
Najpierw implementować #1–#5 (stany + empty states + duration), potem #6 po decyzji projektowej. #8–#9 to dług techniczny na moment budowy watchlist/teams — zanotować w ich specach. #10 warto dorzucić przy okazji pracy ze scenariuszami. #11–#15 to polish.

## Dodatek po ADR-0032 (sygnalizacja świetlna + disclosure nocy, 2026-08-29)

| # | Stan | Kategoria | Gap | Zaczerpnąty stan | Zachowanie po harden | Plik |
|---|------|-----------|-----|------------------|----------------------|------|
| 16 | ✅ | Interaction | Zwinięta noc nieczytelna jako klikalna (sygnał designera) | ghost-przycisk w muted | pełnoszerokościowy przycisk: border + tint pasa night, Show/Hide + chevron, aria-expanded/controls | `DayGroup.tsx` |
| 17 | ✅ | Interaction | Dzień, w którym noc jest JEDYNYM pasmem — treść dnia chowa się za zwinięciem | jw. | auto-open + mini-nagłówek „Night" jak Day/Evening | `DayGroup.tsx` (nightOnly) |
| 18 | ✅ | Filters | `?band=night` opróżnia Day/Evening — wyniki filtru lądują w zwinięciu | jw. | nightOnly zadziała po filtrach automatycznie (liczniki liczą przefiltrowane itemy) | `DayGroup.tsx` |
| 19 | ✅ | A11y | Chipy podsumowania: noc bez licznika (emoji zamiast liczby) | 🌙 Night bez liczby | każdy chip pokazuje liczbę; noc z ikoną Moon | `DayGroup.tsx` |
| 20 | ✅ | A11y | Stories kalendarza bez Routera (useSearchParams rzuca) — puste od lofi | brak dekoratora | meta-dekorator MemoryRouter | `EventCalendarScreen.stories.tsx` |
