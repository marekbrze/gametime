# 0012 - filters: dwupoziomowy pasek filtrowania

**Date**: 2026-08-26
**Module**: filters
**Status**: Accepted

## Context

MODULES.md zapisywał pasek filtrowania z 5 wymiarów (sport → liga → drużyna → pasmo → zakres dat) + toggle MyTeamsFilter w jednym pasku, z ostrzeżeniem projektowym "5 wymiarów bez przytłoczenia". W interview proto-detail designer wskazał, że przy każdej wizycie znaczenie mają tylko dwie decyzje: pora dnia i sport.

## Decision

Pasek dzieli się na dwa poziomy:

- **Tier 1, zawsze widoczny**: pasma (chipsy) + sport (select). Ligi nie mają tu miejsca.
- **Tier 2, schowany**: ligi jako **multi-select** w panelu "More filters", pogrupowane **nagłówkami sportów** (bez kaskady — Serie A dostępna bez wyboru Football), z licznikiem wyborów na przycisku.
- **Drużyna i zakres dat NIE są wymiarami paska w v1**: team-scoping zostaje w module teams (SeasonSchedule), zakres dat jest własnością ekranu-listy (pager tygodnia, sezon, podział watchlisty).
- **Uzgadnianie sport × liga** (jeden stan, dwa widoki): wybór sportu odznacza ligi innych sportów; zaznaczenie obcej ligi przestawia sport na "All sports"; odznaczenie ostatniej ligi zostawia wybrany sport.

## Impact

ACTIONS.md: nagłówek zasady uniwersalnej, wiersz "Filter list" i sekcja Sport/League zaktualizowane (liga multi-select, drużyna/zakres dat wyprowadzone z paska). GLOSSARY.md: termin `FilterBar`, zaktualizowana zasada pasm. `docs/modules/event-calendar.md` zsynchronizowany (bez drużyny). `MiniFilterBar` w event-calendar zostanie zastąpiony przez FilterBar w proto-lofi modułu filters.
