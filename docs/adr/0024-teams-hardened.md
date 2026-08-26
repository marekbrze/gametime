# [0024] - teams prototype hardened

**Date**: 2026-08-26
**Module**: teams
**Status**: Accepted

## Context

Prototyp teams po `proto-lofi` obsługiwał happy paths; audyt `proto-edgecases` (ADR-0023) znalazł 10 gapów — w tym jedyny 🔴: cichą utratę favorites przy padzie zapisu localStorage.

## Decision

Zaimplementowano wszystkie 10 stanów z `docs/modules/teams-edgecases.md`. Decyzje designera (wszystkie z rekomendowanym defaultem audytu): (1) sieroty favorites → nota + Clear z undo, wpisy wracają verbatim; (2) od-ulubienie → undo toast 5s na wszystkich trzech miejscach; (3) obce `?sport`/`?league` na terminarzu → stripowane przy kanonizacji (`useUrlFilters({dimensions:'bands'})` czyta/pisze wyłącznie `?band`). Poza tym: StorageWarning na 3 ekranach (rollback wizualny), „Unknown team" zamiast surowego id (dialog + participantsLabel), search niewrażliwy na diakrytyki, separatory miesięcy w PastSection (prop `monthSeparators`), copy „Data range:", dedup favorites w sanityzacji. Bonus (odkryte E2E): naprawa hooks-order violation w TeamsScreen i przepisanie mutatorów favorites na funkcyjne updatory (undo po 5s czytało nieaktualny closure — lekcja ADR-0018).

## Impact

Każdy flow modułu obsługuje ścieżki błędne tak samo świadomie jak happy path. Odroczone: offline w prod (platformowe). Wizualny szlif to przyszły cykl proto-brand → proto-design → proto-polish. Weryfikacja: E2E harden 20/20 + regresja teams 43/43 + regresja app 4/4 (chromium, dev server, realny snapshot + deterministyczne mocki).
