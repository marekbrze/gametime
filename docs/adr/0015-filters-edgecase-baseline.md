# 0015 - filters: edge-case baseline

**Date**: 2026-08-26
**Module**: filters
**Status**: Accepted

## Context

Prototyp modułu filters (proto-lofi, `0015557`) obsługiwał happy paths i wszystkie edge case'y ze speca; nie przeszedł jeszcze systematycznego stresstestu.

## Decision

Audyt do `docs/modules/filters-edgecases.md`. **13 gapów: 🔴 1 · 🟡 5 · 🟢 7**. Priorytety: (1) 🔴 filtry giną przy zmianie taby — NavLink na goły path gubi query, sprzeczne z "per-ekran w pamięci" z ADR-0013; (2) Now block ignoruje filtry — pytanie do designera; (3) `?w=` bez clampu + empty state kłamie przy deep-linku poza oknem z filtrami; (4) Back spam per checkbox; (5) dryf katalogu statyczny vs snapshot (zanim pipeline dostanie nową ligę).

Kategorie czyste: Errors, State transitions, LocalStorage (moduł celowo nie persystuje), Action outcomes.

## Impact

proto-harden implementuje priority list; #5 kierowane do data-source (rozszerzenie `registerCatalogTeams` o sports/leagues). Po zmianach prototypu — rerun audytu dla świeżego baseline'u.
