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

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🔴 | Loading & async | Initial load bez skeletona | `status === 'loading'` → cała zawartość `null` — na wolnym łączu (Pages, 57 KB JSON) blank między headerem a footerem, zero feedbacku | skeleton odzwierciedlający strukturę (pager + 2–3 grupy dni ghost) | `src/modules/event-calendar/components/EventCalendarScreen.tsx:109` |
| 2 | 🔴 | Errors | Fetch snapshotu pada → ślepa uliczka | prowizoryczny akapit "Failed to load…" (`:103`), **bez retry** — jedyna droga to pełny reload strony; hook nie wystawia `refresh` | error card z przyciskiem Retry + `refresh()` w `useEvents` (ponowny fetch bez reloadu) | `EventCalendarScreen.tsx:103` + `src/modules/data-source/hooks/use-events.ts:49` |
| 3 | 🔴 | Prototype-specific | Zapis localStorage pada po cichu | `useLocalStorage` łapie wyjątek i loguje do konsoli — gwiazdka wygląda na zapisaną, po refresh znika (private mode Safari, quota) | toast "Couldn't save — storage unavailable" + wizualny rollback gwiazdki | `src/shared/hooks/use-local-storage.ts:19,30` |
| 4 | 🟡 | Data states | Tydzień poza oknem danych (−7d/+14d) | pager przewija w nieskończoność; poza oknem → EmptyWeek mówi "It may be off-season — check next week" — **mylące** (to nie off-season, to brak danych) | EmptyWeek wariant "No data for this week — we load 2 weeks ahead" + ewent. dezaktywacja Next na krawędzi okna; wymaga przepuszczenia `window` ze snapshota do ekranu | `EventCalendarScreen.tsx:159-170`, `WeekPager.tsx` (brak limitu) |
| 5 | 🟡 | Data states | Sport off-season w filtrach (sierpień: hockey/basketball) | select pokazuje wszystkie sporty zawsze; filtr 🏒 → pusty tydzień z ogólnym komunikatem | opcja z adnotacją "(no events this week)" lub empty state różnicujący off-season od filtrów | `src/modules/event-calendar/components/MiniFilterBar.tsx:49` |
| 6 | 🟡 | State transitions | Przełożony mecz znika całkowicie | `statusOverride` jest filtrowany z feedu — user, który planował oglądać, **nie dowie się o przełożeniu** (postponed rodzi nową instancję z nowym terminem, ale stara bez śladu) | decyzja projektowa: pokazywać postponed w miejscu starego terminu (dimmed + adnotacja) zamiast ukrywać, albo pozostawić ukrywanie i komunikować tylko przez watchlistę | `src/modules/event-calendar/components/EventCalendarScreen.tsx:48` |
| 7 | 🟡 | Loading & async | "LIVE" po zakończonym meczu (stała 3h) | jedno ESTIMATED 3h dla wszystkich sportów — soccer kończy się po ~2h → przez godzinę pokazuje false-LIVE; z realnych danych user realnie to zobaczy | per-sport szacunki (soccer 2.5h, NHL/NBA 2.75h, NFL 3.5h); F1: OpenF1 daje `date_end` — pipeline mógłby je zapisywać | `src/modules/data-source/lib/status.ts:4` |
| 8 | 🟡 | Cross-module | Osierocone wpisy watchlisty po przełożeniu | WATCHLIST_ENTRY trzyma `eventId`; przełożony mecz = nowe ID (ESPN często tworzy nowy event) → wpis wskazuje w próżnię; moduł watchlist jeszcze nie istnieje, ale kontrakt już to dziedziczy | zapisywać w entry też `{sportId, leagueId, startUtc, label}` snapshot — rekoncyliacja po ID, fallback po dopasowaniu | `src/modules/watchlist/hooks/use-watchlist.ts` (typ `WatchlistEntry`) |
| 9 | 🟡 | Cross-module | Ulubione drużyny z ery mocków | użytkownicy publicznej strony mogli dodać favorites na ID mockowych (`nhl-tor`) — po przełączeniu na `espn-*` nie rozwiązują się nigdzie, MyTeamsFilter łapie pusto, **bez sygnału** | jednorazowa migracja/oczyszczenie martwych ID (mock pattern rozpoznawalny: brak prefiksu `espn-`) albo komunikat w teams module | `src/modules/teams/hooks/use-favorite-teams.ts` |
| 10 | 🟡 | Prototype-specific | Brak scenariusza "mock" dla dev bez sieci | mocki są już tylko fallbackiem przy braku `data.json` — z commitem snapshota **nie ma drogi** do mocków z DevToolbar (np. test offline/Storybook deterministyczny) | scenariusz `mock` piszący `gametime.devEvents: generateMockEvents()` | `src/scenarios/index.ts` |
| 11 | 🟢 | Loading & async | Świeżość danych niewidoczna | `generatedAt` wraca ze snapshota, nikt go nie prezentuje — user nie odróżnia danych z dziś od wczorajszych (pipeline raz dziennie) | subtelna stopka "Data as of {godzina}" | `use-events.ts` (zwraca `generatedAt`) → brak konsumenta w `EventCalendarScreen.tsx:24` |
| 12 | 🟢 | Errors | Offline przy pierwszej wizycie | brak service workera; offline → prod error state (z #2 bez retry jeszcze gorsze) | copy error state uwzględniające "check connection"; docelowo cache-first fetch | `use-events.ts:49` |
| 13 | 🟢 | Navigation | Back button przy stronicowaniu tygodni | klik Next 5×, wciśnięcie back **wychodzi ze strony** zamiast cofnąć tygodnie (offset w useState, bez historii) | `history.pushState` per tydzień albo zaakceptować (ADR-0006 nie obiecuje shareability) | `EventCalendarScreen.tsx:30` (`weekOffset`), `WeekPager.tsx` |
| 14 | 🟢 | Navigation | Deep-link do konkretnego tygodnia | refresh/udostępnienie URL gubi wyświetlany tydzień (zawsza bieżący) | `?w={offset}` w hash URL | `EventCalendarScreen.tsx:30` |
| 15 | 🟢 | Action outcomes | ExportMenu bez Escape-close | menu zamyka się klikiem-outside, ale Escape nie działa; focus wraca do przycisku? | `onKeyDown` Escape + focus return | `src/modules/calendar-export/components/ExportMenu.tsx:20` |

**Kategorie sprawdzone bez gapów**: Forms & input (moduł nie ma formularzy — settings to osobny moduł); unicode/długie wartości (truncate + title-only F1 — OK); walidacja wejścia (brak wejść użytkownika poza modułami localStorage); dead-endy nawigacji (This week zawsze dostępny).

## Priority list
1. **#1 + #2 — skeleton + error z retry na głównym ekranie**: to jest pierwszy kontakt z produktem; blank i ślepa uliczka przy padniętym fetchu podważają obietnicę "od wejścia działa". Wymaga drobnego rozszerzenia `useEvents` o `refresh()`.
2. **#3 — cichy błąd zapisu localStorage**: jedyna droga utraty danych użytkownika w aplikacji; rollback + toast to mały koszt.
3. **#4 + #5 — empty states świadome okna danych i off-seasonu**: rdzeń produktu to odpowiedź "co w tym tygodniu" — komunikat nie może kłamać (dziś wmawia off-season na tygodniu, dla którego po prostu nie mamy danych).
4. **#7 — per-sport czas trwania**: z realnych danych false-LIVE to codzienny artefakt widoczny w bloku Now.
5. **#6 — widoczność przełożonych**: decyzja projektowa do podjęcia z designerem (ukrywanie vs dimming w starym terminie) — przed budową modułu watchlist, bo #8 z niej wynika.

## Hand-off to proto-harden
Najpierw implementować #1–#5 (stany + empty states + duration), potem #6 po decyzji projektowej. #8–#9 to dług techniczny na moment budowy watchlist/teams — zanotować w ich specach. #10 warto dorzucić przy okazji pracy ze scenariuszami. #11–#15 to polish.
