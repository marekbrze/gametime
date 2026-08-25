# 0011 - event-calendar zahardowany: stany ładowania/błędu/storage + decyzja o widoczności przełożonych

**Date**: 2026-08-25
**Module**: event-calendar, data-source
**Status**: Accepted

## Context
Audyt proto-edgecases (ADR-0010) wykazał 15 gapów po przełączeniu na realne dane. Najpoważniejsze: blank przy ładowaniu, error bez retry, cichy błąd zapisu localStorage, mylące empty states na tygodniach poza oknem danych, false-LIVE ze stałej 3h.

## Decision
Zaimplementowano 11 z 15 (kolejność priorytetów audytu):
- **Skeleton** pierwszego ładowania (`WeekSkeleton`) + **error card z Try again** (`LoadError`, `useEvents.refresh()`)
- **Storage write-first + rollback wizualny** (`useLocalStorage`) + banner `StorageWarning` eksponowany z hooków watchlist/favorites/settings
- **EmptyWeek świadomy okna danych** (beyondWindow → "No data for this week" + zakres + Back to this week) + suffix " — no events" dla sportów off-season w filtrze
- **Per-sport czas trwania** (`estimatedDurationMs`): soccer 2.5h, hockey 2.75h, basketball 2.5h, NFL 3.5h, F1 per sessionType — ten sam szacunek w eksporcie kalendarzy
- **Postponed widoczny przygaszony** (decyzja designera) — zostaje w starym terminie z adnotacją; canceled nadal ukryty
- Stopka "Data as of", scenariusz dev `mock`, Escape w ExportMenu z powrotem focusu

Odroczone (4): #8 snapshot danych w WatchlistEntry → proto-detail watchlist; #9 migracja mockowych ID favorites → moduł teams; #13/#14 URL/history tygodni → moduł filters.

## Impact
Każda ścieżka błędna ma story (`States/*` w Storybook) i przechodzi lint a11y. Happy path bez zmian. Dokumentacja: edgecases.md oznaczone ✅/❌, spec modułu zsynchronizowany. Visual polish — przyszły proto-design.
