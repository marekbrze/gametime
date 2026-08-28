# 0027 - Settings edge-case baseline

**Date**: 2026-08-28
**Module**: settings
**Status**: Accepted

## Context

Ekran ustawień zbudowany w proto-lofi (5899f12) obsługiwał happy paths +
cztery edge case'y złapane już w specu. Brak systematycznego stresstestu
ścieżek błędnych wokół wartości zapisywanych w localStorage.

## Decision

Audyt w `docs/modules/settings-edgecases.md`: 6 gapów (🔴 1, 🟡 2, 🟢 3).
Top priorytety: (1) nieprawidłowa wartość `timezone` przechodzi sanitize →
RangeError Intl → biały ekran całej aplikacji (zweryfikowane eksperymentalnie);
(2) strefa poprawna dla Intl, ale nieobecna na liście selecta (legacy aliasy
`Poland`/`US/Pacific`) renderuje pusty select; (3) niespójne pasma z ręcznej
edycji storage psują geometrię podglądu. Odroczone/decyzje designera: fallback
`supportedValuesOf`, multi-tab sync (platformowe), kontrast etykiet pasm
(tokeny → proto-design).

## Impact

proto-harden wdraża listę priorytetów; pytania dla designera zapisane
w hand-off (fallback stref: 12 vs ~30; niespójne pasma: defaults vs snap;
multi-tab: teraz czy platformowo). Po zmianach prototypu audyt powtórzyć.
