# 0005 — Blok Now na statusach wyliczanych (bez realtime)

**Date**: 2026-08-24
**Module**: event-calendar
**Status**: Accepted

## Context
Owner chce natychmiastowej identyfikacji wydarzeń trwających i "łatwych do obejrzenia". Constraint z MODULES.md: statyczne dane z data-pipeline (cron) — brak API realtime, brak wyników na żywo.

## Decision
Zintegrowany blok **Now** na szczycie listy: (a) wydarzenia trwające — badge LIVE + "Started Xh Ym ago", gdzie `live = start ≤ teraz < start + ~3h`; (b) **starting soon** — start w ciągu ≤60 min, z odliczaniem "in N min". Oba wyliczane czysto z czasu startu. Brak minutnika meczu i wyniku — świadomie. Próg 60 min. Zaktualizowano ACTIONS (View Now block) i GLOSSARY (NowBlock).

## Impact
Doświadczenie "co teraz" działa bez żadnego realtime API. Zmiany statusów (przekładane/odwołane) widoczne z lagiem pipeline'u — akceptowane. Ewentualne przyszłe live API może podmienić źródło sygnału bez zmiany UI.
