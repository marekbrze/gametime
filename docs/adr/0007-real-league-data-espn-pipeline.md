# 0007 - Real League Data: ESPN hidden API + pipeline na GitHub Actions

**Date**: 2026-08-25
**Status**: Accepted

## Context
Prototyp `event-calendar` działa na mockach; MODULES.md oznaczyło `data-pipeline` jako ryzyko techniczne #1 wymagające wczesnego spike'u. Trzeba było wybrać źródło realnych terminarzy 8 lig v1 (NHL, NBA, NFL, F1, Premier League, Serie A, Bundesliga, La Liga) i ścieżkę dostarczenia ich do statycznej strony na GitHub Pages.

## Decision
Źródłem v1 jest **ESPN hidden API** (`site.api.espn.com`) — jeden adapter, zero kluczy, zweryfikowany probe'em (2026-08-25) dla wszystkich 8 lig: działa z zakresami dat, zwraca UTC ISO, stabilne ID drużyn i statusy. Pipeline to skrypt Node uruchamiany GitHub Action na cronie (raz dziennie, 04:23 UTC — decyzja designera po początkowym wariancie 6h), commitujący `public/data.json` (`DataSnapshot`: katalog + wydarzenia w oknie −7d/+14d); commit triggeruje deploy Pages. `data-source` czyta snapshot fetchem same-origin; mocki zostają fallbackiem dev/Storybook.

Odrzucone alternatywy: per-ligowe oficjalne API (5+ adapterów, klucze/limity), football-data.org (klucz, tylko piłka nożna), scraping stron lig (najkruchsze).

Znane ryzyko akceptowane: API nieudokumentowane — łagodzone wersjonowanym `source` w snapshocie, fail-soft per liga i czerwony Action tylko przy totalnym failu. Otwarty punkt: granularność sesji F1 (spike zdecyduje: race-only vs OpenF1 jako drugie źródło) — odroczone.

## Impact
Zaplanowane w `docs/changes/real-league-data.md`. Bez nowego modułu — wypełnia `data-pipeline`, przełącza `data-source`, nowe stany runtime (loading/error/no-data) w `event-calendar` na edgecases→harden. Zero nowych akcji użytkownika. Routing: proto-detail → budowa pipeline (direct edits) → edgecases → harden.
