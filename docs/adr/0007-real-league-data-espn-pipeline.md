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

## Ocena licencyjna / ToS (uzupełniona po pytaniu designera, 2026-08-25)

- **OpenF1**: czyste — API dokumentowane, darmowe, open source, limity 3 req/s / 30 req/min (my: 2 req/dzień). Publikujemy fakty (godziny sesji), nie treści F1.
- **ESPN hidden API**: szara strefa — endpointy nieudokumentowane, bez publicznej licencji; ToS ESPN formalnie ogranicza automatyczny dostęp. Akceptujemy dla prototypu non-commercial, bo profil użycia jest minimalny:
  1. ~14 requestów/dzień z CI (użytkownicy **nigdy** nie dotykają ESPN — strona czyta wyłącznie statyczny JSON z Pages),
  2. republishujemy wyłącznie fakty: daty, godziny, nazwy drużyn (bez wyników, logo, treści redakcyjnych),
  3. brak kluczy/autoryzacji do obejścia — endpointy publicznie dostępne.
- **Warunek wyjścia**: przy komercjalizacji lub znaczącym ruchu — wymiana źródeł na licencjonowane: football-data.org (4 ligi piłkarskie, darmowy tier z kluczem), oficjalne NHL API, OpenF1; NBA/NFL wymagają wtedy płatnych providentów. Do tego czasu ryzyko praktyczne ≈ zero; ryzyko inżynieryjne (zmiana kształtu API) łagodzi fail-soft per liga.
