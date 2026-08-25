# 0008 - F1: pełna granularność sesji z OpenF1 (nie ESPN)

**Date**: 2026-08-25
**Module**: data-pipeline
**Status**: Accepted

## Context
Open question z PROJECT.md: czy każda sesja weekendu F1 to osobne wydarzenie, czy jedno zbiorcze (domysł: osobne, wyścig wyróżniony). ESPN hidden API zwraca sesje jako osobne eventy, ale probe (2026-08-25) pokazał, że scoreboard **nie wylicza pełnego weekendu z wyprzedzeniem** — dla zakresu 2026-09-04…06 zwrócił wyłącznie FP1.

## Decision
Pipeline bierze F1 z **OpenF1** (`api.openf1.org/v1`: `sessions` + `meetings`) jako drugi adapter obok ESPN. Każda sesja = osobny `SportEvent` (`"f1-{session_key}"`), tytuł `"{meeting_name} — {session_name}"`. Dodano opcjonalne pole kontraktu `SportEvent.sessionType: 'practice' | 'qualifying' | 'race'` — strukturalny marker, żeby UI wyróżniało wyścig bez parsowania tytułu. Probe potwierdził: pełny weekend Italian GP 2026 (P1/P2/P3/Quali/Race) z dokładnymi godzinami, bez klucza API.

## Impact
Drugi adapter w pipeline (koszt: jeden endpoint więcej); ESPN pozostaje wyłącznie dla 7 lig zespołowych. Zmiana kontraktu `SportEvent` w data-source (pole opcjonalne — wstecznie zgodne). Open question w PROJECT.md zamknięty. Konstruktorzy jako `Team` — nadal odroczone (eventy F1 title-only).
