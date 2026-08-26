# 0016 - filters: prototype hardened

**Date**: 2026-08-26
**Module**: filters
**Status**: Accepted

## Context

Prototyp modułu filters przeszedł audyt proto-edgecases (ADR-0015): 13 gapów (🔴 1 · 🟡 5 · 🟢 7), z czego happy paths i wszystkie stany ze speca działały.

## Decision

Zaimplementowano **10 gapów**:

1. **#1 🔴 Filtry przy zmianie taby** — `AppShell` pamięta ostatni query `/event-calendar` (`useCalendarSearch`); taba Calendar wraca z filtrami. Tylko w pamięci — świeża wizyta nadal czysto (zgodne z ADR-0013; logo pozostaje gołym linkiem = świadomy "home/reset").
2. **#2 Now block × filtry — decyzja designera: filtry obowiązują Now** — wspólny predykat `passesScreenFilters` karmi listę tygodnia i blok Now; pusty zbiór = Now znika.
3. **#3 Clamp `?w=` do ±52** tygodni.
4. **#4 Beyond-window dominuje nad filtrami** w empty state — deep-link z `w` poza oknem nie twierdzi, że "nie pasuje do filtrów".
5. **#6 Coalescing historii — decyzja designera**: pierwsza zmiana push, kolejne w <500 ms replace (precyzuje ADR-0014 — Back chodzi po stanach, nie po tickach).
6. **#8 Kanonizacja URL na wejściu** (replace, raz): konflikty/duplikaty/śmieci nie wiszą w pasku adresu.
7. **#9 Powtórzone `league` parametry** scalane (`.getAll`).
8. **#11 Popover z max-height + scroll** (przyszły wzrost katalogu).
9. **#12 `aria-live`** z liczbą widocznych wydarzeń — filtr nie jest ciszą dla SR.
10. **#13 Podpowiedź w panelu** przy wybranym sporcie: obca liga zeruje wybór sportu.

**Odroczone (3)**: #5 dryf katalogu → moduł data-source (rozszerzenie `registerCatalogTeams` o sports/leagues, przed pierwszą nową ligą w pipeline); #7 mock/dev bez DataWindow → zakres event-calendar (ADR-0011); #10 resize md-boundary → zaakceptowane.

## Impact

Każda ścieżka widoku — tab-switch, deep-link z śmieciami, szybkie serie zmian, puste wyniki — zachowuje się przewidywalnie; happy paths bez zmian (zweryfikowane E2E w chromium: 10 checków harden + 10 regresji happy-path, wszystkie zielone). Nowe story: `States/EmptyBeyondWindowWithFilters`, `Filters/FilterBar → LeaguePanelSportSelected`. ADR-0014 doprecyzowany w punkcie o historii (coalescing). Visual polish — przyszły proto-design.
