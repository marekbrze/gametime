# 0035 - Szczegóły wydarzenia na każdej liście, ligi klikalne

**Date**: 2026-08-29
**Status**: Accepted

## Context

`EventDetailsDialog` (data/godzina, liga, pasmo, status, migracja przełożonego gwiazdki, eksporty, linki uczestników) działał wyłącznie na watchliście — mimo że kalendarz tygodnia i terminarz drużyny renderują te same wiersze (EventRow/EventCard). Nazwy lig nigdzie nie były klikalne, choć nawigacja sport → liga → drużyna (ADR-0020) istnieje i uczestnicy w dialogu już są linkami (ADR-0022).

## Decision

1. **`EventDetailsDialog` przeniesiony z watchlist do event-calendar** (modyfikuje punkt 2 ADR-0022 o własności komponentu — konsumentami są teraz wszystkie ekrany list; watchlist importuje, zachowanie bez zmian).
2. **Klik w etykietę uczestników otwiera dialog na każdej liście meczów**: kalendarz (DayGroup, wiersze i karty), NowBlock, terminarz drużyny (upcoming + PastSection flat — flat dostaje `onOpenDetails`, dotąd tylko tryb grupowany), watchlista (bez zmian).
3. **`LeagueLink`** — współdzielony komponent: Link do `/teams/league/:leagueId` gdy liga w katalogu, zwykły tekst dla id poza katalogiem (zasada ADR-0024: link do gwarantowanego not-found nie ląduje w UI). Użyty w dialogu (rzząd League), EventRow, EventCard, NowBlock i headerze terminarza drużyny. F1 linkuje do swojego ekranu ligi (ten ma własne wyjaśnienie + link do kalendarza).
4. **„Watch new date" z każdej listy**: `remove(stara) + add(nową)` przez tę samą instancję `useWatchlist`, która zasila gwiazdki wierszy (brak synchronizacji między instancjami `useLocalStorage` — migrate z osobnej instancji odświeżyłby tylko po remouncie). Wydarzenie nieobserwowane → gwiazdka po prostu ląduje na nowym terminie. Feedback toastem.
5. **`findRescheduled` → `data-source/lib/reschedule.ts`** — czysta semantyka feedu (statusOverride, teamIds, ISO leksykograficznie), obok `status.ts`; konsumentem dialog poza modułem watchlist.

Plan w `docs/changes/event-details-everywhere.md`. Bez nowego modułu.

## Impact

- Trzy ekrany list domykają pętlę „jump to event" (ACTIONS.md) — szczegóły osiągalne wszędzie tam, gdzie wiersz meczu.
- Nawigacja ligowa z wierszy/dialogu zwiększa ruch przez ekran ligi (ADR-0020) bez nowego UI.
- Stories regresyjne + synchronizacja speców (event-calendar.md, teams.md, watchlist.md, ACTIONS.md).
- ADR-0022: punkt o własności dialogu wygaszony przez tę decyzję; pozostałe punkty (linki uczestników, zwarty wiersz) obowiązują.
