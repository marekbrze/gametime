# [0019] - pipeline: sezonowe okno danych zamiast −7d/+14d

**Date**: 2026-08-26
**Module**: teams / data-pipeline
**Status**: Accepted

## Context

Detailing modułu teams: MODULES.md obiecuje „View season schedule — pełny terminarz sezonu drużyny", ale DataWindow snapshota to −7d/+14d (ADR-0009) — terminarz fizycznie nie ma z czego pokazać pełnego sezonu. Designer wybrał spośród trzech opcji: (a) szczery label „tylko okno", (b) rozszerzenie okna pipeline'u, (c) fetch ESPN on-demand w przeglądarce.

## Decision

Opcja (b): ligi zespołowe (7 lig ESPN) pobierają **pełny sezon zawierający datę generacji** — zakres z `leagues[].season` (fallback: heurystyka per liga), fetch w chunkach miesięcznych z dedupem po id. F1 zostaje przy oknie −7d/+14d (OpenF1, ADR-0008). Pole `window` snapshota staje się **unią** okien lig (min from / max to). Opcja (c) odrzucona — łamie zasadę „tylko statyczny snapshot" (CORS, zależność od live API); opcja (a) odrzucona — łamie obietnicę produktową.

## Impact

- GLOSSARY.md: definicja `DataWindow` przepisana (sezony lig + unia).
- data-pipeline: `run.ts`/`espn.ts` — okno per liga, chunki, fail-soft z zachowaniem events poprzedniego snapshota; bez zmian kontraktu `SportEvent`.
- Wolumetria: ~4–5k wydarzeń/rok, ~1,5–2 MB pretty-printed (~250–400 KB gzip) — akceptowalne dla statycznego GitHub Pages.
- Konsumenci `window` (beyond-window states w event-calendar/watchlist) działają bez zmian kodu — unia zachowuje semantykę „poza zakresem danych".
