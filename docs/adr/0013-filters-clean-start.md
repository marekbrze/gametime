# 0013 - filters: czysty start każdej wizyty, stan w pamięci

**Date**: 2026-08-26
**Module**: filters
**Status**: Accepted

## Context

Decyzja o lifecycle stanu filtrów: klasyka pułapka zestawów filtrów — użytkownik zawęża listę, wraca za tydzień i milczy w zdumieniu "czemu nie widzę meczów NHL", bo filtr wisi z poprzedniej wizyty. Filtry to decyzje na dziś, nie preferencje (w przeciwieństwie do watchlisty i ustawień, które persystują).

## Decision

- **Czysty start każdej wizyty**: świeże otwarcie bez parametrów URL = "All sports, any time", zero wybranych lig.
- **Stan per-ekran, w pamięci**: kalendarz i watchlist trzymają własne stany filtrów; moduł filters **nie pisze nic do localStorage**.
- **Jedyny nośnik stanu między sesjami to URL** (ADR-0014): bookmark/zlink zachowuje widok, "czysta wizyta" to wizyta bez parametrów.
- **Zero match po filtrach** → inline empty state "No matches for these filters" + **Clear filters** — nowa akcja w ACTIONS.md, wariant świadomie odrębny od off-season i beyond-window (ADR-0011).

## Impact

ACTIONS.md: nowa akcja "Clear filters", wiersz "Filter list" opisany jako per-ekran/czysty start. Filtry nie dokładają żadnych kluczy localStorage — moduł nie uczestniczy w handle'ingu awarii zapisu (StorageWarning zostaje domeną watchlisty/settings).
