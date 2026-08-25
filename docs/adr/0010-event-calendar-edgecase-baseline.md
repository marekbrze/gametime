# 0010 - event-calendar edge-case baseline (po przełączeniu na realne dane)

**Date**: 2026-08-25
**Module**: event-calendar, data-source
**Status**: Accepted

## Context
Moduł przeszedł z mocków na realny `DataSnapshot` (feat real-league-data). Happy path działa, ale nowe warunki runtime — fetch sieciowy, okno danych −7d/+14d, ligi w off-season, realna wolumetria — nie były stresstestowane.

## Decision
Audyt w `docs/modules/event-calendar-edgecases.md`. 15 gapów: 🔴 3 (blank loading, error bez retry, cichy błąd zapisu localStorage) · 🟡 7 · 🟢 5. Priorytety: skeleton+retry na głównym ekranie, feedback błędu zapisu, empty states świadome okna danych i off-seasonu, per-sport czas trwania (false-LIVE), widoczność przełożonych meczów (decyzja projektowa).

## Impact
`proto-harden` implementuje priority listę; #8 (osierocone wpisy watchlisty) i #9 (mockowe ID favorites) zanotowane jako dług na moment budowy modułów watchlist/teams. Wolumetria 156 eventów zweryfikowana OK — ponowny wzrokowy check nocnych sekcji po powrocie NHL/NBA w październiku. Re-run proto-edgecases po istotnych zmianach prototypu.
