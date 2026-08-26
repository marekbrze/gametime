# [0023] - teams edge-case baseline

**Date**: 2026-08-26
**Module**: teams
**Status**: Accepted

## Context

Prototyp modułu teams (po `proto-lofi`, commit ecbbf54) obsługuje happy paths i stany z sekcji Edge Cases specyfikacji, ale nie przeszedł systematycznego stres-testu.

## Decision

Audyt do `docs/modules/teams-edgecases.md`. 10 gapów: 🔴 1 (cicha utrata favorites przy padzie zapisu localStorage — `writeError` bez konsumenta), 🟡 4 (sieroty favorites po cichu, obce parametry URL zabijające terminarz niewidocznym filtrem, od-ulubienie bez undo, surowe id jako link uczestnika w dialogu), 🟢 5 (diakrytyki w searchu, separatory miesięcy tylko w Upcoming, copy „data range", dedup favorites, martwe `first:mt-0`). Offline w prod dalej odroczone platformowo (jak ADR-0018 #13).

## Impact

`proto-harden` implementuje priority list; przy gapach #2/#3/#4 potwierdza kształt z designerem (rekomendacje audytu to default). Po harden — świeży baseline audytu.
