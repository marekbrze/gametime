# 0009 - Kontrakt DataSnapshot: statyczny JSON jako jedyne źródło prawdy o danych

**Date**: 2026-08-25
**Module**: data-pipeline, data-source
**Status**: Accepted

## Context
DataPipeline potrzebuje ustalonego formatu wyjścia, zanim data-source przestawi się z mocków na realne dane. MODULES.md flaguje stabilność kontraktu JSON jako warunek wstępny dla wszystkich modułów konsumenckich (teams, watchlist, filters).

## Decision
Wyjściem pipeline'u jest `public/data.json` — `DataSnapshot`: `{ generatedAt, source, window, catalog: {sports, leagues, teams}, events }`. Okno `DataWindow` = −7 dni / +14 dni od generacji. Sortowanie deterministyczne (`startUtc`, potem `id`) dla czytelnych diffów commitów. Schematy ID: `"espn-{id}"` (eventy i drużyny), `"f1-{session_key}"` (sesje). Katalog drużyn z endpointu `teams` (pełne składy lig, stabilne ID — fundament `FavoriteTeam`). Nowe terminy w GLOSSARY: `DataSnapshot`, `DataWindow`.

## Impact
`data-source` czyta snapshot fetchem same-origin; mocki zostają fallbackiem dev/Storybook. Wszystkie przyszłe moduły konsumują katalog ze snapshota — zmiany schematu wymagają nowego ADR. Rozmiar szacowany ~100–200 wydarzeń / 30–60 KB na okno — pomijalne dla Pages.
